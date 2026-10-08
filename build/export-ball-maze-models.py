"""Read-only source export. Run with Blender 4.5, never save the source .blend.

blender -b Ball.blend --python build/export-ball-maze-models.py -- \
  --mesh-root PATH --ue-parts PATH --ue-materials PATH --ue-textures PATH \
  --output PATH --posters PATH
UE material parameters and mesh parts are exported from the game, not invented.
"""
import argparse
import json
import math
import struct
import sys
from collections import deque
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument('--mesh-root', required=True)
parser.add_argument('--ue-parts', required=True)
parser.add_argument('--ue-materials', required=True)
parser.add_argument('--ue-textures', help='Legacy compatibility; prefer the matched .blend/OBJ texture atlases')
parser.add_argument('--output', required=True)
parser.add_argument('--posters', required=True)
parser.add_argument('--only', help='Comma-separated IDs; merge updated entries into the existing manifest')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
source_file = bpy.data.filepath
materials = json.loads(Path(args.ue_materials).read_text())
output = Path(args.output)
posters = Path(args.posters)
output.mkdir(parents=True, exist_ok=True)
posters.mkdir(parents=True, exist_ok=True)

specs = {
 'normal': ['NormalBall_01'], 'attraction': ['AttractionBall_01'],
 'repulsion': ['RepulsionBall_01'], 'phase': ['PhasingBall_01'],
 'basketball': ['BasketBall'], 'hamster': ['HamsterBall_Glass','Hamster Ball_Cap_Green'],
 'golf': [], 'shuttlecock': ['Shuttlecock_Normal_01'], 'tennis': ['TennisBall'],
 'time-stop': ['TimeStopBall_Shell_01','TimeStopBall_Rim_01','TimeStopBall_Rim_02','TimeStopBall_Rim_03','TimeStopBall_Rotor_01','TimeStopBall_Rotor_02','TimeStopBall_MinuteHand_01','TimeStopBall_HourHand_01','TimeStopBall_SecondHand_01'],
 'bonfire': ['bonefire.ball_1','bonefire.ball_7'], 'rocket': ['RocketBall_Ball','RocketBall_Rocket'],
 'rewind': ['RewindBall_Shell','RewindBall_Glass','RewindBall_Center'],
 'yoyo': ['yoo yoo ball_1'], 'paint': ['paint.ball_1'], 'slime': [],
 'bomb': ['bomb.ball-2_3','bomb.ball-2_1','bomb.ball-2_2'], 'glass': [],
 'curling': ['未命名'], 'twins': [],
}

scene = bpy.data.scenes.new('BallMazeWebExport')
bpy.context.window.scene = scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'Standard'
world = bpy.data.worlds.new('WebStudio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.8,0.85,0.9,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.65
scene.world = world
camera_data = bpy.data.cameras.new('WebCamera')
camera = bpy.data.objects.new('WebCamera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = 'ORTHO'
for name, location, energy, size in [('Key',(3,-4,5),450,5),('Fill',(-3,-1,2),250,4)]:
    data = bpy.data.lights.new(name,'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size
    light = bpy.data.objects.new(name,data)
    scene.collection.objects.link(light)
    light.location = location
    light.rotation_euler = (-light.location).to_track_quat('-Z','Y').to_euler()

def center_and_size(obj, diameter):
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    low = Vector([min(p[i] for p in points) for i in range(3)])
    high = Vector([max(p[i] for p in points) for i in range(3)])
    # Bake OBJ import rotation and its distant authoring origin into the mesh.
    # Geometry ends up centered; no enormous inverse node transform is needed.
    obj.data.transform(Matrix.Scale(diameter / max(high-low), 4) @ Matrix.Translation(-(low+high)/2) @ obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)
    obj.data.update()

def matte_material(name, color_node=None, alpha=1):
    mat = bpy.data.materials.new(name + '_WebMatte')
    mat.use_nodes = True
    mat.use_backface_culling = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Roughness'].default_value = 0.92 if alpha == 1 else 0.7
    bsdf.inputs['Specular IOR Level'].default_value = 0.05
    bsdf.inputs['Transmission Weight'].default_value = 0
    bsdf.inputs['Alpha'].default_value = alpha
    if alpha < 1:
        # Alpha compositing, rather than refracting the environment, keeps the
        # real opaque hamster visible inside a lightweight voxel glass shell.
        mat.surface_render_method = 'BLENDED'
    if color_node and color_node.type == 'TEX_IMAGE':
        texture = mat.node_tree.nodes.new('ShaderNodeTexImage')
        texture.image = color_node.image
        texture.interpolation = 'Closest'
        texture.extension = 'EXTEND'
        mat.node_tree.links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])
    elif color_node and color_node.type == 'VERTEX_COLOR':
        color = mat.node_tree.nodes.new('ShaderNodeVertexColor')
        color.layer_name = color_node.layer_name
        mat.node_tree.links.new(color.outputs['Color'], bsdf.inputs['Base Color'])
    return mat

def palette_gutter_pixels(source, coverage_alpha=False):
    # MagicaVoxel stores the unused atlas area as transparent black. Color-only
    # sampling still reads its RGB at concave face edges. Extend the nearest
    # real palette texel into that empty area before baking; keep every opaque
    # source texel unchanged and never edit the original image.
    width, height = source.size
    pixels = list(source.pixels[:])
    nearest = [-1] * (width * height)
    queue = deque()
    for index in range(width * height):
        alpha = pixels[index * 4 + 3]
        if alpha > 0:
            if coverage_alpha:
                # Bake alpha is raster coverage, not material transparency.
                # Recover straight color before discarding that coverage so
                # antialiased white edges do not become grey/black outlines.
                for channel in range(3):
                    pixels[index * 4 + channel] = min(1, pixels[index * 4 + channel] / alpha)
                pixels[index * 4 + 3] = 1
            nearest[index] = index
            queue.append(index)
    if not queue:
        raise ValueError('Source Color atlas has no visible palette: ' + source.name)
    while queue:
        index = queue.popleft()
        x, y = index % width, index // width
        neighbors = []
        if x: neighbors.append(index - 1)
        if x + 1 < width: neighbors.append(index + 1)
        if y: neighbors.append(index - width)
        if y + 1 < height: neighbors.append(index + width)
        for neighbor in neighbors:
            if nearest[neighbor] != -1:
                continue
            nearest[neighbor] = nearest[index]
            queue.append(neighbor)
    for index, origin in enumerate(nearest):
        if pixels[index * 4 + 3] == 0:
            pixels[index * 4:index * 4 + 4] = pixels[origin * 4:origin * 4 + 3] + [1]
    return pixels

def padded_source_color(source):
    width, height = source.size
    padded = bpy.data.images.new(source.name.replace('.', '_') + '_WebSourcePad', width=width, height=height, alpha=True)
    padded.colorspace_settings.name = source.colorspace_settings.name
    padded.pixels[:] = palette_gutter_pixels(source)
    padded.update()
    return padded

def bake_padded_atlas(obj):
    # The source's greedy/concave voxel UV islands touch black atlas padding.
    # Do not shrink those UV polygons: that distorts their nonrectangular
    # footprint. Bake the original Color onto a separate, padded web UV atlas.
    # All source vertices, topology, source textures and the .blend stay intact.
    textures = [(mat, next((n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None)) for mat in obj.data.materials]
    textures = [(mat, texture) for mat, texture in textures if texture]
    if not textures:
        return
    obj['web_source_textures'] = [bpy.path.abspath(texture.image.filepath) if texture.image.filepath else texture.image.name for mat, texture in textures]
    atlas_name = textures[0][1].image.name.replace('.', '_') + '_WebAtlas'
    source_uv = obj.data.uv_layers.active
    for mat, texture in textures:
        texture.image = padded_source_color(texture.image)
        mapping = mat.node_tree.nodes.new('ShaderNodeUVMap')
        mapping.uv_map = source_uv.name
        mat.node_tree.links.new(mapping.outputs['UV'], texture.inputs['Vector'])
    web_uv = obj.data.uv_layers.new(name='WebPaddedUV')
    # Edit-mode mesh synchronization invalidates UV-layer RNA references.
    # Keep the name as a plain string and reacquire the layer after unwrapping.
    web_uv_name = web_uv.name
    obj.data.uv_layers.active = web_uv
    web_uv.active_render = True
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(89), island_margin=0.03)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.data.uv_layers.active = obj.data.uv_layers[web_uv_name]
    obj.data.uv_layers[web_uv_name].active_render = True
    baked = bpy.data.images.new(atlas_name, width=512, height=512, alpha=True)
    targets = []
    for mat, texture in textures:
        target = mat.node_tree.nodes.new('ShaderNodeTexImage')
        target.image = baked
        mat.node_tree.nodes.active = target
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        alpha = bsdf.inputs['Alpha'].default_value
        bsdf.inputs['Alpha'].default_value = 1
        targets.append((mat, texture, target, alpha))
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=8, use_clear=True)
    # Triangulation and nearest sampling can expose uncovered concave atlas
    # pixels even with bake margins. Pad the baked image as well, and remove
    # coverage alpha; material alpha remains on the Principled shader.
    baked.pixels[:] = palette_gutter_pixels(baked, coverage_alpha=True)
    baked.update()
    baked.pack()
    for mat, texture, target, alpha in targets:
        mat.node_tree.nodes.remove(target)
        texture.image = baked
        for link in list(texture.inputs['Vector'].links):
            link.from_node.uv_map = web_uv_name
        mat.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value = alpha
    print('BM_WEB_ATLAS ' + obj.name, flush=True)

def source_obj(name):
    original = bpy.data.objects[name]
    obj = original.copy()
    obj.data = original.data.copy()
    obj.parent = None
    scene.collection.objects.link(obj)
    obj.hide_render = False
    obj.hide_viewport = False
    obj.hide_set(False)
    obj.location.x = obj.location.y = 0
    alpha = {'TimeStopBall_Shell_01': 0.15, 'RewindBall_Glass': 0.15, 'HamsterBall_Glass': 0.2}.get(name, 1)
    for i, original_material in enumerate(obj.data.materials):
        # The latest .blend meshes have different UV atlases from the older UE
        # textures, especially basketball, tennis and hamster. Preserve the
        # Color node paired with each mesh instead of swapping atlas versions.
        color_node = original_material.node_tree.nodes.get('Color')
        if color_node and color_node.type == 'TEX_IMAGE' and not color_node.image:
            raise ValueError('Missing matching source Color texture: ' + name)
        obj.data.materials[i] = matte_material(name, color_node, alpha)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    return obj

def import_obj(name, diameter):
    before = set(scene.objects)
    bpy.ops.wm.obj_import(filepath=str(Path(args.mesh_root)/'20250928'/(name+'.obj')))
    objects = [o for o in scene.objects if o not in before and o.type == 'MESH']
    for obj in objects:
        center_and_size(obj, diameter)
        image = bpy.data.images.load(str(Path(args.mesh_root)/'20250928'/(name+'_Color.png')), check_existing=True)
        texture = bpy.data.materials.new(name+'_SourceColor')
        texture.use_nodes = True
        color_node = texture.node_tree.nodes.new('ShaderNodeTexImage')
        color_node.image = image
        mat = matte_material(name, color_node)
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    return objects

def material_for_variant(obj, suffix):
    params = next(m for m in materials if m['path'].split('.')[-1] == suffix)
    mat = bpy.data.materials.new(suffix + '_WebPBR')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = params['vectors']['Color']
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Roughness'].default_value = 0.7
    bsdf.inputs['Specular IOR Level'].default_value = 0.05
    bsdf.inputs['Transmission Weight'].default_value = 1 - params['scalars']['Opacity']
    bsdf.inputs['IOR'].default_value = params['scalars']['Refraction']
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def variant(part, material, offset=0):
    before = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(Path(args.ue_parts)/(part+'.glb')))
    objects = [o for o in scene.objects if o not in before and o.type == 'MESH']
    for obj in objects:
        # Imported UE geometry retains its source topology; normalize only units/framing.
        center_and_size(obj, 2.5)
        obj.location.x += offset
        material_for_variant(obj, material)
    return objects

def stable_voxel_sampling(path):
    # Blender's default nearest mipmap sampler can bleed adjacent atlas tiles
    # into white voxel edges. These tiny source atlases need nearest sampling
    # without mipmaps, clamped at the image boundary. The binary is untouched.
    data = path.read_bytes()
    json_size = struct.unpack_from('<I', data, 12)[0]
    document = json.loads(data[20:20+json_size])
    for sampler in document.get('samplers', []):
        sampler.update(magFilter=9728, minFilter=9728, wrapS=33071, wrapT=33071)
    encoded = json.dumps(document, ensure_ascii=False, separators=(',', ':')).encode()
    encoded += b' ' * ((-len(encoded)) % 4)
    remaining = data[20+json_size:]
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 20+len(encoded)+len(remaining)) + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + remaining)

only = set(args.only.split(',')) if args.only else set(specs)
if not only.issubset(specs):
    raise ValueError('Unknown ball IDs: ' + ','.join(sorted(only-set(specs))))
existing = json.loads((output/'manifest.json').read_text()) if args.only and (output/'manifest.json').exists() else []
manifest = {entry['id']: entry for entry in existing}
for id, names in specs.items():
    if id not in only:
        continue
    objects = [source_obj(name) for name in names]
    if id == 'golf': objects = import_obj('GolfBall_A',2.5)
    if id == 'hamster':
        hamster = import_obj('Hamster_Stand_Yellow',1.35)
        for obj in hamster: obj.location.z -= 0.3
        objects += hamster
    if id == 'rocket':
        ball, rockets = objects
        bpy.context.view_layer.update()
        ball_points = [ball.matrix_world @ Vector(c) for c in ball.bound_box]
        rocket_points = [rockets.matrix_world @ Vector(c) for c in rockets.bound_box]
        ball_low = min(p.z for p in ball_points)
        ball_high = max(p.z for p in ball_points)
        rocket_center = (min(p.z for p in rocket_points)+max(p.z for p in rocket_points))/2
        rockets.location.z += ball_low + (ball_high-ball_low)*0.25 - rocket_center
    if id == 'glass': objects = variant('GlassBall__SM_GlassBall_01','MI_GlassBall_01')
    if id == 'slime': objects = variant('SlimeBall__SM_SlimeBall_01','MI_SlimeBall_01')
    if id == 'twins':
        objects = variant('TwinBalls__SM_TwinBall_Blue_01','MI_TwinBall_Blue_01',-1.5)
        objects += variant('TwinBalls__SM_TwinBall_Red_01','MI_TwinBall_Red_01',1.5)
    bpy.context.view_layer.update()
    points = [o.matrix_world @ Vector(c) for o in objects for c in o.bound_box]
    low = Vector([min(p[i] for p in points) for i in range(3)])
    high = Vector([max(p[i] for p in points) for i in range(3)])
    center = (low+high)/2
    for obj in objects: obj.location -= center
    bpy.context.view_layer.update()
    # Store clean centered geometry, not the original scene's layout offsets.
    for obj in objects:
        obj.data.transform(obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
        obj.data.update()
        bake_padded_atlas(obj)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    path = output/(id+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
        export_materials='EXPORT', export_image_format='AUTO', export_texcoords=True,
        export_normals=True, export_yup=True, export_animations=False, export_cameras=False,
        export_lights=False)
    stable_voxel_sampling(path)
    diameter = max(high-low)
    camera.location = (diameter*1.4,-diameter*2,diameter*1.1)
    camera.rotation_euler = (-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.ortho_scale = diameter*1.45
    scene.render.filepath = str(posters/(id+'.png'))
    bpy.ops.render.render(write_still=True)
    texture_sources = sorted({path for obj in objects for path in obj.get('web_source_textures', [])})
    manifest[id] = {'id':id,'file':id+'.glb','source_objects':names + (['Hamster_Stand_Yellow'] if id == 'hamster' else []),
        'vertices':sum(len(o.data.vertices) for o in objects), 'source':source_file if names else 'UE static mesh or source OBJ',
        'texture_sources':texture_sources, 'web_material_style':'matte-voxel', 'bytes':path.stat().st_size}
    if id == 'rocket': manifest[id]['rocket_anchor_height_fraction'] = 0.25
    if id == 'hamster': manifest[id]['shell_alpha'] = 0.2
    for obj in objects: bpy.data.objects.remove(obj,do_unlink=True)
    print('BM_WEB_EXPORTED ' + id, flush=True)
with open(output/'manifest.json','w') as stream:
    json.dump([manifest[id] for id in specs if id in manifest],stream,ensure_ascii=False,indent=2)
