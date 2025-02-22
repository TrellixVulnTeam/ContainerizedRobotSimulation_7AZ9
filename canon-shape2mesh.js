import { THREE, Load } from './three.js';

function main(CANNON, shape, material) {
    let mesh;

    switch (shape.type) {

    case CANNON.Shape.types.SPHERE:
        var sphere_geometry = new THREE.SphereGeometry(shape.radius, 8, 8);
        mesh = new THREE.Mesh(sphere_geometry, material);
        break;

    case CANNON.Shape.types.PARTICLE:
        mesh = new THREE.Mesh(this.particleGeo, material);
        mesh.scale.set(s.particleSize, s.particleSize, s.particleSize);
        break;

    case CANNON.Shape.types.PLANE:
        var geometry = new THREE.PlaneGeometry(10, 10, 4, 4);
        mesh = new THREE.Object3D();
        var submesh = new THREE.Object3D();
        var ground = new THREE.Mesh(geometry, material);
        ground.scale.set(100, 100, 100);
        submesh.add(ground);

        ground.castShadow = true;
        ground.receiveShadow = true;

        mesh.add(submesh);
        break;

    case CANNON.Shape.types.BOX:
        var box_geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2,
            shape.halfExtents.y * 2,
            shape.halfExtents.z * 2);
        mesh = new THREE.Mesh(box_geometry, material);
        break;

    case CANNON.Shape.types.CONVEXPOLYHEDRON:
        var geo = new THREE.Geometry();

        // Add vertices
        for (var i = 0; i < shape.vertices.length; i++) {
            var v = shape.vertices[i];
            geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
        }

        for (var i = 0; i < shape.faces.length; i++) {
            var face = shape.faces[i];

            // add triangles
            var a = face[0];
            for (var j = 1; j < face.length - 1; j++) {
                var b = face[j];
                var c = face[j + 1];
                geo.faces.push(new THREE.Face3(a, b, c));
            }
        }
        geo.computeBoundingSphere();
        geo.computeFaceNormals();
        mesh = new THREE.Mesh(geo, material);
        break;

    case CANNON.Shape.types.HEIGHTFIELD:
        var geometry = new THREE.Geometry();

        var v0 = new CANNON.Vec3();
        var v1 = new CANNON.Vec3();
        var v2 = new CANNON.Vec3();
        for (var xi = 0; xi < shape.data.length - 1; xi++) {
            for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
                for (var k = 0; k < 2; k++) {
                    shape.getConvexTrianglePillar(xi, yi, k === 0);
                    v0.copy(shape.pillarConvex.vertices[0]);
                    v1.copy(shape.pillarConvex.vertices[1]);
                    v2.copy(shape.pillarConvex.vertices[2]);
                    v0.vadd(shape.pillarOffset, v0);
                    v1.vadd(shape.pillarOffset, v1);
                    v2.vadd(shape.pillarOffset, v2);
                    geometry.vertices.push(
                        new THREE.Vector3(v0.x, v0.y, v0.z),
                        new THREE.Vector3(v1.x, v1.y, v1.z),
                        new THREE.Vector3(v2.x, v2.y, v2.z)
                    );
                    var i = geometry.vertices.length - 3;
                    geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
                }
            }
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, material);
        break;

    case CANNON.Shape.types.TRIMESH:
        var geometry = new THREE.Geometry();

        var v0 = new CANNON.Vec3();
        var v1 = new CANNON.Vec3();
        var v2 = new CANNON.Vec3();
        for (var i = 0; i < shape.indices.length / 3; i++) {
            shape.getTriangleVertices(i, v0, v1, v2);
            geometry.vertices.push(
                new THREE.Vector3(v0.x, v0.y, v0.z),
                new THREE.Vector3(v1.x, v1.y, v1.z),
                new THREE.Vector3(v2.x, v2.y, v2.z)
            );
            var j = geometry.vertices.length - 3;
            geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, material);
        break;

    default:
        throw "Visual type not recognized: " + shape.type;
    }

    mesh.receiveShadow = true;
    mesh.castShadow = true;
    if (mesh.children) {
        for (var i = 0; i < mesh.children.length; i++) {
            mesh.children[i].castShadow = true;
            mesh.children[i].receiveShadow = true;
            if (mesh.children[i]) {
                for (var j = 0; j < mesh.children[i].length; j++) {
                    mesh.children[i].children[j].castShadow = true;
                    mesh.children[i].children[j].receiveShadow = true;
                }
            }
        }
    }

    return mesh;
}

export default Load(['CANNON']).then(([CANNON]) => {
    main = main.bind(undefined, CANNON);

    return (body, material) => {

        if (body.shapes.length) {
            const obj = new THREE.Object3D();
            body.shapes.forEach(x => obj.add(main(x, material)));
            return obj;
        }
        else
            return main(body.shapes[0], material);
    };
});
