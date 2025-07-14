import { 
    BoundingRectangle, 
    Cartesian2, 
    Cartesian3, 
    Cartesian4, 
    Cesium3DTileset, 
    CustomShader, 
    Matrix4, 
    Transforms, 
    UniformType,  
    CustomShaderTranslucencyMode
} from "cesium";

/**
 * DSM剖切
 *
 * @export
 * @param {number[]} positions: 剖切范围顶点
 * @param {Cesium3DTileset} tileset： 加载的模型
 * @return {*} 
 */
export default function clipByTexture(positions: number[], tileset: Cesium3DTileset){
    let pos = Cartesian3.fromDegreesArrayHeights(positions)
    /* 将坐标转换到模型坐标系 */
    const center = tileset.boundingSphere.center
    let matrix = Transforms.eastNorthUpToFixedFrame(center)
    matrix = Matrix4.inverse(matrix, new Matrix4())
    let localPos = []
    pos.forEach(p => {
        localPos.push(Matrix4.multiplyByPoint(matrix, p, new Cartesian3()))
    })
    /* 生成剖切纹理 */
    let rect = BoundingRectangle.fromPoints(localPos)
    // 归一化到画布坐标
    let texPos = []
    localPos.forEach(p => {
        texPos.push(new Cartesian2((p.x - rect.x), rect.height - (p.y - rect.y)))
    })
    // 创建画布
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext("2d")
    canvas.width = rect.width
    canvas.height = rect.height

    // canvas.style.cssText = "position: absolute; left: 0;"
    // 绘制图形
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    const point01 = texPos[0]
    ctx.moveTo(point01.x, point01.y)
    for(let i=1;i<texPos.length;i++){
        ctx.lineTo(texPos[i].x, texPos[i].y)
    }
    ctx.closePath()
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    // document.body.appendChild(canvas)
    // rectangle参数
    let rectangle= new Cartesian4(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
    return {
        canvas,
        rectangle,
        matrix
    }
}

//// 示例
async function demo(){
    const tileset = await Cesium3DTileset.fromUrl(this.url)
    const clipParam = clipByTexture([106.66374345679873, 32.06492059380404, 680.9743167742679,
      106.67121111739124, 32.06693478862742, 725.7795696447827,
      106.67029500376246, 32.071674730081035, 728.7983535153613
    ], tileset)
    const customshader = new CustomShader({
        translucencyMode: CustomShaderTranslucencyMode.TRANSLUCENT,
        uniforms: {
            clipMap: {
                type: UniformType.SAMPLER_2D,
                value: clipParam.canvas
            },
            clipRectangle: {
                type: UniformType.VEC4,
                value: clipParam.rectangle
            },
            clipMatrix: {
                type: UniformType.MAT4,
                value: clipParam.matrix
            }
        },
        fragmentShaderText:`
        float clip(vec3 p){
          p = (clipMatrix * vec4(p, 1.0)).xyz;
          if(p.x >= clipMapRect.x && p.x <= clipMapRect.z && p.y >= clipMapRect.y && p.y <= clipMapRect.w){
            vec2 uv = vec2((p.x - clipMapRect.x) / (clipMapRect.z - clipMapRect.x), (p.y - clipMapRect.y) / (clipMapRect.w - clipMapRect.y));
            return texture(clipMap, uv).r;
          } 
          return 0.0;
        }

        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material){

            float kk = clip(fsInput.attributes.positionWC);
            material.alpha = kk;
        }
        `
    })
}