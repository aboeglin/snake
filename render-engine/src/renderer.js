const { curry, propOr } = require("ramda");
const { mat4, glMatrix } = require("gl-matrix");

const { FRAGMENT_SHADER_COLOR, VERTEX_SHADER } = require("./shaders");

const createProgram = gl => {
  var vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FRAGMENT_SHADER_COLOR);
  gl.compileShader(fs);

  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(vs));

  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(fs));

  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.log(gl.getProgramInfoLog(program));

  return program;
};

const initRenderer = ({ gl, width, height }) => {
  if (gl === undefined) {
    throw new Error("You must provide a context !");
  }

  gl.viewport(0, 0, width, height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const program = createProgram(gl);

  const projectionMatrix = makeProjectionMatrix(width, height);

  return renderer({ gl, program, matrices: [projectionMatrix] });
};

const renderer = curry(({ gl, program, matrices }, root) => {
  // TODO: clean up that mess
  if (root.type === "RECT") {
    matrices.push(mat4.fromTranslation([], [root.x, root.y, root.z]));
    // const copy = matrices.filter(() => true);
    const proj = matrices.shift();
    matrices.reverse().unshift(proj);

    const matrix = matrices.reduce(
      (final, mat) => mat4.multiply([], final, mat),
      mat4.create()
    );
    renderRect({ gl, program, matrix }, root);
    matrices = [matrix];
  } else if (root.type === "TRANSFORM") {
    matrices.push(
      mat4.fromRotation([], glMatrix.toRadian(root.rotation), [0, 0, 1])
    );
  }

  propOr([], "children", root).forEach(node =>
    renderer({ gl, program, matrices }, node)
  );

  // Reset matrices or don't alter the one given to children for reference transparency.
});

const makeProjectionMatrix = curry((viewportWidth, viewportHeight) => {
  const orthoMat = mat4.ortho([], 0, viewportWidth, 0, viewportHeight, 0, 1000);
  // We need the rotation in order to get the x axis horizontal
  const rotationMat = mat4.fromRotation([], Math.PI / 2, [0, 0, 1]);
  return mat4.multiply([], rotationMat, orthoMat);
});

const renderRect = curry(({ gl, program, matrix }, rect) => {
  const vertices = new Float32Array(rectToVertexArr(rect));
  console.log(vertices);

  const vbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.useProgram(program);
  program.uColor = gl.getUniformLocation(program, "uColor");
  program.matrix = gl.getUniformLocation(program, "matrix");
  program.vertexPosition = gl.getAttribLocation(program, "vertexPosition");
  gl.enableVertexAttribArray(program.aVertexPosition);

  // Set color
  gl.uniform4fv(program.uColor, [1.0, 1.0, 0.0, 1.0]);
  // Add fourth vertex value
  gl.vertexAttribPointer(program.vertexPosition, 3, gl.FLOAT, false, 0, 0);
  // Add fourth vertex value
  gl.uniformMatrix4fv(program.matrix, false, matrix);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
});

const rectToVertexArr = rect => [
  -rect.width / 2,
  -rect.height / 2,
  rect.z,

  -rect.width / 2,
  rect.height / 2,
  rect.z,

  rect.width / 2,
  rect.height / 2,
  rect.z,

  rect.width / 2,
  rect.height / 2,
  rect.z,

  rect.width / 2,
  -rect.height / 2,
  rect.z,

  -rect.width / 2,
  -rect.height / 2,
  rect.z
];

module.exports = { initRenderer };
