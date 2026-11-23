import bpy,json,sys,math,os,time
from mathutils import Matrix,Vector
scenes=json.load(open('/tmp/qq-scenes/scenes.json'))
output=os.environ.get('PANORAMA_OUTPUT','/tmp/qq-hq')
os.makedirs(output,exist_ok=True)
# 360 stills use the same scene geometry as the realtime renderer.
conv=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
for name,data in scenes.items():
    
    if os.path.exists(f'{output}/{name}.png'): continue
    start=time.time();bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=12 if name in ['exterior','garden'] else 8;scene.cycles.use_denoising=False;scene.cycles.max_bounces=2;scene.cycles.diffuse_bounces=2;scene.cycles.glossy_bounces=1;scene.cycles.transparent_max_bounces=2
    scene.render.resolution_x=6144 if name in ['exterior','garden'] else 4608;scene.render.resolution_y=scene.render.resolution_x//2;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.6
    world=bpy.data.worlds.new('Daylight');world.use_nodes=True;scene.world=world
    nodes=world.node_tree.nodes;bg=nodes.get('Background');bg.inputs['Color'].default_value=(.60,.76,.80,1);bg.inputs['Strength'].default_value=.65
    mats={}
    for k,m in data['materials'].items():
        mat=bpy.data.materials.new(k);mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(*m['color'],1);bsdf.inputs['Roughness'].default_value=.75
        if m['texture']:
            tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(m['texture']);mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
        if m['unlit']:
            if m['texture']:mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Emission Color'])
            else:bsdf.inputs['Emission Color'].default_value=(*m['color'],1)
            bsdf.inputs['Emission Strength'].default_value=.12
        mats[k]=mat
    meshes={}
    for k,g in data['geoms'].items():
        p=g['positions'];verts=[tuple(p[i:i+3]) for i in range(0,len(p),3)];ids=g['indices'] or list(range(len(verts)));faces=[ids[i:i+3] for i in range(0,len(ids),3)]
        mesh=bpy.data.meshes.new(k);mesh.from_pydata(verts,[],faces);mesh.update()
        if g['uvs']:
            uv=mesh.uv_layers.new(name='UVMap');uvs=g['uvs']
            for poly in mesh.polygons:
                for li in poly.loop_indices:
                    vi=mesh.loops[li].vertex_index;uv.data[li].uv=(uvs[vi*2],uvs[vi*2+1])
        meshes[k]=mesh
    for i,o in enumerate(data['objects']):
        obj=bpy.data.objects.new(str(i),meshes[o['geometry']].copy());scene.collection.objects.link(obj);a=o['matrix'];m=Matrix(tuple(tuple(a[c*4+r] for c in range(4)) for r in range(4)));obj.matrix_world=conv@m;obj.data.materials.append(mats[o['material']])
    ld=bpy.data.lights.new('Sun','SUN');ld.energy=2.5 if name in ['exterior','garden'] else 1.6;ld.angle=.1;sun=bpy.data.objects.new('Sun',ld);scene.collection.objects.link(sun);sun.rotation_euler=(math.radians(28),math.radians(-22),math.radians(-35))
    if name not in ['exterior','garden']:
        for x in [-5,0,5]:
            ld=bpy.data.lights.new('Ceiling','AREA');ld.energy=180;ld.shape='DISK';ld.size=5;lamp=bpy.data.objects.new('Ceiling',ld);scene.collection.objects.link(lamp);lamp.location=(x,0,5.65)
    camera=bpy.data.cameras.new('Panorama');camera.type='PANO';camera.panorama_type='EQUIRECTANGULAR';obj=bpy.data.objects.new('Panorama',camera);scene.collection.objects.link(obj);p=data['position'];obj.location=(p[0],-p[2],p[1]);obj.rotation_euler=(math.pi/2,0,0);scene.camera=obj
    scene.render.filepath=f'{output}/{name}.png';bpy.ops.render.render(write_still=True);print('DONE',name,round(time.time()-start,1),flush=True)
