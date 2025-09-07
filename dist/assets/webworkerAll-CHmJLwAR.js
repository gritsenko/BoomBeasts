import{E as f,U as ot,T as le,M as v,l as G,d as Re,H as T,t as S,a6 as Ue,R as te,w as q,F as Me,D as E,ad as ce,Q as N,ae as F,m as O,af as ut,$ as Be,ag as de,S as W,y as I,ah as lt,ai as re,K as Q,aj as A,c as he,B as k,s as ne,u as ct,G as dt,_ as J,ak as ht,n as Fe,q as Ge,a8 as De,ab as Ae,al as ke,o as ft,p as pt,a9 as mt,aa as gt,ac as xt,am as _t,an as bt,ao as Z,ap as yt,aq as Tt,a3 as fe,ar as pe,e as y,as as vt}from"./index-BVMNGBqH.js";import{c as L,a as wt,b as Ct,B as ze}from"./colorToUniform-BXaCBwVl.js";class Oe{static init(e){Object.defineProperty(this,"resizeTo",{set(t){globalThis.removeEventListener("resize",this.queueResize),this._resizeTo=t,t&&(globalThis.addEventListener("resize",this.queueResize),this.resize())},get(){return this._resizeTo}}),this.queueResize=()=>{this._resizeTo&&(this._cancelResize(),this._resizeId=requestAnimationFrame(()=>this.resize()))},this._cancelResize=()=>{this._resizeId&&(cancelAnimationFrame(this._resizeId),this._resizeId=null)},this.resize=()=>{if(!this._resizeTo)return;this._cancelResize();let t,r;if(this._resizeTo===globalThis.window)t=globalThis.innerWidth,r=globalThis.innerHeight;else{const{clientWidth:n,clientHeight:s}=this._resizeTo;t=n,r=s}this.renderer.resize(t,r),this.render()},this._resizeId=null,this._resizeTo=null,this.resizeTo=e.resizeTo||null}static destroy(){globalThis.removeEventListener("resize",this.queueResize),this._cancelResize(),this._cancelResize=null,this.queueResize=null,this.resizeTo=null,this.resize=null}}Oe.extension=f.Application;class We{static init(e){e=Object.assign({autoStart:!0,sharedTicker:!1},e),Object.defineProperty(this,"ticker",{set(t){this._ticker&&this._ticker.remove(this.render,this),this._ticker=t,t&&t.add(this.render,this,ot.LOW)},get(){return this._ticker}}),this.stop=()=>{this._ticker.stop()},this.start=()=>{this._ticker.start()},this._ticker=null,this.ticker=e.sharedTicker?le.shared:new le,e.autoStart&&this.start()}static destroy(){if(this._ticker){const e=this._ticker;this.ticker=null,e.destroy()}}}We.extension=f.Application;class Ie{constructor(e){this._renderer=e}push(e,t,r){this._renderer.renderPipes.batch.break(r),r.add({renderPipeId:"filter",canBundle:!1,action:"pushFilter",container:t,filterEffect:e})}pop(e,t,r){this._renderer.renderPipes.batch.break(r),r.add({renderPipeId:"filter",action:"popFilter",canBundle:!1})}execute(e){e.action==="pushFilter"?this._renderer.filter.push(e):e.action==="popFilter"&&this._renderer.filter.pop()}destroy(){this._renderer=null}}Ie.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"filter"};const me=new v;function Pt(o,e){e.clear();const t=e.matrix;for(let r=0;r<o.length;r++){const n=o[r];if(n.globalDisplayStatus<7)continue;const s=n.renderGroup??n.parentRenderGroup;s!=null&&s.isCachedAsTexture?e.matrix=me.copyFrom(s.textureOffsetInverseTransform).append(n.worldTransform):s!=null&&s._parentCacheAsTextureRenderGroup?e.matrix=me.copyFrom(s._parentCacheAsTextureRenderGroup.inverseWorldTransform).append(n.groupTransform):e.matrix=n.worldTransform,e.addBounds(n.bounds)}return e.matrix=t,e}const St=new Ue({attributes:{aPosition:{buffer:new Float32Array([0,0,1,0,1,1,0,1]),format:"float32x2",stride:8,offset:0}},indexBuffer:new Uint32Array([0,1,2,0,2,3])});class Rt{constructor(){this.skip=!1,this.inputTexture=null,this.backTexture=null,this.filters=null,this.bounds=new Me,this.container=null,this.blendRequired=!1,this.outputRenderSurface=null,this.globalFrame={x:0,y:0,width:0,height:0}}}class Ee{constructor(e){this._filterStackIndex=0,this._filterStack=[],this._filterGlobalUniforms=new G({uInputSize:{value:new Float32Array(4),type:"vec4<f32>"},uInputPixel:{value:new Float32Array(4),type:"vec4<f32>"},uInputClamp:{value:new Float32Array(4),type:"vec4<f32>"},uOutputFrame:{value:new Float32Array(4),type:"vec4<f32>"},uGlobalFrame:{value:new Float32Array(4),type:"vec4<f32>"},uOutputTexture:{value:new Float32Array(4),type:"vec4<f32>"}}),this._globalFilterBindGroup=new Re({}),this.renderer=e}get activeBackTexture(){var e;return(e=this._activeFilterData)==null?void 0:e.backTexture}push(e){const t=this.renderer,r=e.filterEffect.filters,n=this._pushFilterData();n.skip=!1,n.filters=r,n.container=e.container,n.outputRenderSurface=t.renderTarget.renderSurface;const s=t.renderTarget.renderTarget.colorTexture.source,i=s.resolution,a=s.antialias;if(r.length===0){n.skip=!0;return}const l=n.bounds;if(this._calculateFilterArea(e,l),this._calculateFilterBounds(n,t.renderTarget.rootViewPort,a,i,1),n.skip)return;const u=this._getPreviousFilterData(),d=this._findFilterResolution(i);let c=0,h=0;u&&(c=u.bounds.minX,h=u.bounds.minY),this._calculateGlobalFrame(n,c,h,d,s.width,s.height),this._setupFilterTextures(n,l,t,u)}generateFilteredTexture({texture:e,filters:t}){const r=this._pushFilterData();this._activeFilterData=r,r.skip=!1,r.filters=t;const n=e.source,s=n.resolution,i=n.antialias;if(t.length===0)return r.skip=!0,e;const a=r.bounds;if(a.addRect(e.frame),this._calculateFilterBounds(r,a.rectangle,i,s,0),r.skip)return e;const l=s;this._calculateGlobalFrame(r,0,0,l,n.width,n.height),r.outputRenderSurface=T.getOptimalTexture(a.width,a.height,r.resolution,r.antialias),r.backTexture=S.EMPTY,r.inputTexture=e,this.renderer.renderTarget.finishRenderPass(),this._applyFiltersToTexture(r,!0);const h=r.outputRenderSurface;return h.source.alphaMode="premultiplied-alpha",h}pop(){const e=this.renderer,t=this._popFilterData();t.skip||(e.globalUniforms.pop(),e.renderTarget.finishRenderPass(),this._activeFilterData=t,this._applyFiltersToTexture(t,!1),t.blendRequired&&T.returnTexture(t.backTexture),T.returnTexture(t.inputTexture))}getBackTexture(e,t,r){const n=e.colorTexture.source._resolution,s=T.getOptimalTexture(t.width,t.height,n,!1);let i=t.minX,a=t.minY;r&&(i-=r.minX,a-=r.minY),i=Math.floor(i*n),a=Math.floor(a*n);const l=Math.ceil(t.width*n),u=Math.ceil(t.height*n);return this.renderer.renderTarget.copyToTexture(e,s,{x:i,y:a},{width:l,height:u},{x:0,y:0}),s}applyFilter(e,t,r,n){const s=this.renderer,i=this._activeFilterData,l=i.outputRenderSurface===r,u=s.renderTarget.rootRenderTarget.colorTexture.source._resolution,d=this._findFilterResolution(u);let c=0,h=0;if(l){const p=this._findPreviousFilterOffset();c=p.x,h=p.y}this._updateFilterUniforms(t,r,i,c,h,d,l,n),this._setupBindGroupsAndRender(e,t,s)}calculateSpriteMatrix(e,t){const r=this._activeFilterData,n=e.set(r.inputTexture._source.width,0,0,r.inputTexture._source.height,r.bounds.minX,r.bounds.minY),s=t.worldTransform.copyTo(v.shared),i=t.renderGroup||t.parentRenderGroup;return i&&i.cacheToLocalTransform&&s.prepend(i.cacheToLocalTransform),s.invert(),n.prepend(s),n.scale(1/t.texture.orig.width,1/t.texture.orig.height),n.translate(t.anchor.x,t.anchor.y),n}destroy(){}_setupBindGroupsAndRender(e,t,r){if(r.renderPipes.uniformBatch){const n=r.renderPipes.uniformBatch.getUboResource(this._filterGlobalUniforms);this._globalFilterBindGroup.setResource(n,0)}else this._globalFilterBindGroup.setResource(this._filterGlobalUniforms,0);this._globalFilterBindGroup.setResource(t.source,1),this._globalFilterBindGroup.setResource(t.source.style,2),e.groups[0]=this._globalFilterBindGroup,r.encoder.draw({geometry:St,shader:e,state:e._state,topology:"triangle-list"}),r.type===te.WEBGL&&r.renderTarget.finishRenderPass()}_setupFilterTextures(e,t,r,n){if(e.backTexture=S.EMPTY,e.inputTexture=T.getOptimalTexture(t.width,t.height,e.resolution,e.antialias),e.blendRequired){r.renderTarget.finishRenderPass();const s=r.renderTarget.getRenderTarget(e.outputRenderSurface);e.backTexture=this.getBackTexture(s,t,n==null?void 0:n.bounds)}r.renderTarget.bind(e.inputTexture,!0),r.globalUniforms.push({offset:t})}_calculateGlobalFrame(e,t,r,n,s,i){const a=e.globalFrame;a.x=t*n,a.y=r*n,a.width=s*n,a.height=i*n}_updateFilterUniforms(e,t,r,n,s,i,a,l){const u=this._filterGlobalUniforms.uniforms,d=u.uOutputFrame,c=u.uInputSize,h=u.uInputPixel,p=u.uInputClamp,x=u.uGlobalFrame,_=u.uOutputTexture;a?(d[0]=r.bounds.minX-n,d[1]=r.bounds.minY-s):(d[0]=0,d[1]=0),d[2]=e.frame.width,d[3]=e.frame.height,c[0]=e.source.width,c[1]=e.source.height,c[2]=1/c[0],c[3]=1/c[1],h[0]=e.source.pixelWidth,h[1]=e.source.pixelHeight,h[2]=1/h[0],h[3]=1/h[1],p[0]=.5*h[2],p[1]=.5*h[3],p[2]=e.frame.width*c[2]-.5*h[2],p[3]=e.frame.height*c[3]-.5*h[3];const g=this.renderer.renderTarget.rootRenderTarget.colorTexture;x[0]=n*i,x[1]=s*i,x[2]=g.source.width*i,x[3]=g.source.height*i,t instanceof S&&(t.source.resource=null);const m=this.renderer.renderTarget.getRenderTarget(t);this.renderer.renderTarget.bind(t,!!l),t instanceof S?(_[0]=t.frame.width,_[1]=t.frame.height):(_[0]=m.width,_[1]=m.height),_[2]=m.isRoot?-1:1,this._filterGlobalUniforms.update()}_findFilterResolution(e){let t=this._filterStackIndex-1;for(;t>0&&this._filterStack[t].skip;)--t;return t>0&&this._filterStack[t].inputTexture?this._filterStack[t].inputTexture.source._resolution:e}_findPreviousFilterOffset(){let e=0,t=0,r=this._filterStackIndex;for(;r>0;){r--;const n=this._filterStack[r];if(!n.skip){e=n.bounds.minX,t=n.bounds.minY;break}}return{x:e,y:t}}_calculateFilterArea(e,t){if(e.renderables?Pt(e.renderables,t):e.filterEffect.filterArea?(t.clear(),t.addRect(e.filterEffect.filterArea),t.applyMatrix(e.container.worldTransform)):e.container.getFastGlobalBounds(!0,t),e.container){const n=(e.container.renderGroup||e.container.parentRenderGroup).cacheToLocalTransform;n&&t.applyMatrix(n)}}_applyFiltersToTexture(e,t){const r=e.inputTexture,n=e.bounds,s=e.filters;if(this._globalFilterBindGroup.setResource(r.source.style,2),this._globalFilterBindGroup.setResource(e.backTexture.source,3),s.length===1)s[0].apply(this,r,e.outputRenderSurface,t);else{let i=e.inputTexture;const a=T.getOptimalTexture(n.width,n.height,i.source._resolution,!1);let l=a,u=0;for(u=0;u<s.length-1;++u){s[u].apply(this,i,l,!0);const c=i;i=l,l=c}s[u].apply(this,i,e.outputRenderSurface,t),T.returnTexture(a)}}_calculateFilterBounds(e,t,r,n,s){var _;const i=this.renderer,a=e.bounds,l=e.filters;let u=1/0,d=0,c=!0,h=!1,p=!1,x=!0;for(let g=0;g<l.length;g++){const m=l[g];if(u=Math.min(u,m.resolution==="inherit"?n:m.resolution),d+=m.padding,m.antialias==="off"?c=!1:m.antialias==="inherit"&&c&&(c=r),m.clipToViewport||(x=!1),!!!(m.compatibleRenderers&i.type)){p=!1;break}if(m.blendRequired&&!(((_=i.backBuffer)==null?void 0:_.useBackBuffer)??!0)){q("Blend filter requires backBuffer on WebGL renderer to be enabled. Set `useBackBuffer: true` in the renderer options."),p=!1;break}p=m.enabled||p,h||(h=m.blendRequired)}if(!p){e.skip=!0;return}if(x&&a.fitBounds(0,t.width/n,0,t.height/n),a.scale(u).ceil().scale(1/u).pad((d|0)*s),!a.isPositive){e.skip=!0;return}e.antialias=c,e.resolution=u,e.blendRequired=h}_popFilterData(){return this._filterStackIndex--,this._filterStack[this._filterStackIndex]}_getPreviousFilterData(){let e,t=this._filterStackIndex-1;for(;t>0&&(t--,e=this._filterStack[t],!!e.skip););return e}_pushFilterData(){let e=this._filterStack[this._filterStackIndex];return e||(e=this._filterStack[this._filterStackIndex]=new Rt),this._filterStackIndex++,e}}Ee.extension={type:[f.WebGLSystem,f.WebGPUSystem],name:"filter"};let U=null,C=null;function Ut(o,e){U||(U=E.get().createCanvas(256,128),C=U.getContext("2d",{willReadFrequently:!0}),C.globalCompositeOperation="copy",C.globalAlpha=1),(U.width<o||U.height<e)&&(U.width=ce(o),U.height=ce(e))}function ge(o,e,t){for(let r=0,n=4*t*e;r<e;++r,n+=4)if(o[n+3]!==0)return!1;return!0}function xe(o,e,t,r,n){const s=4*e;for(let i=r,a=r*s+4*t;i<=n;++i,a+=s)if(o[a+3]!==0)return!1;return!0}function Mt(...o){let e=o[0];e.canvas||(e={canvas:o[0],resolution:o[1]});const{canvas:t}=e,r=Math.min(e.resolution??1,1),n=e.width??t.width,s=e.height??t.height;let i=e.output;if(Ut(n,s),!C)throw new TypeError("Failed to get canvas 2D context");C.drawImage(t,0,0,n,s,0,0,n*r,s*r);const l=C.getImageData(0,0,n,s).data;let u=0,d=0,c=n-1,h=s-1;for(;d<s&&ge(l,n,d);)++d;if(d===s)return N.EMPTY;for(;ge(l,n,h);)--h;for(;xe(l,n,u,d,h);)++u;for(;xe(l,n,c,d,h);)--c;return++c,++h,C.globalCompositeOperation="source-over",C.strokeRect(u,d,c-u,h-d),C.globalCompositeOperation="copy",i??(i=new N),i.set(u/r,d/r,(c-u)/r,(h-d)/r),i}const _e=new N;class Bt{getCanvasAndContext(e){const{text:t,style:r,resolution:n=1}=e,s=r._getFinalPadding(),i=F.measureText(t||" ",r),a=Math.ceil(Math.ceil(Math.max(1,i.width)+s*2)*n),l=Math.ceil(Math.ceil(Math.max(1,i.height)+s*2)*n),u=O.getOptimalCanvasAndContext(a,l);this._renderTextToCanvas(t,r,s,n,u);const d=r.trim?Mt({canvas:u.canvas,width:a,height:l,resolution:1,output:_e}):_e.set(0,0,a,l);return{canvasAndContext:u,frame:d}}returnCanvasAndContext(e){O.returnCanvasAndContext(e)}_renderTextToCanvas(e,t,r,n,s){var R,D,w,B;const{canvas:i,context:a}=s,l=ut(t),u=F.measureText(e||" ",t),d=u.lines,c=u.lineHeight,h=u.lineWidths,p=u.maxLineWidth,x=u.fontProperties,_=i.height;if(a.resetTransform(),a.scale(n,n),a.textBaseline=t.textBaseline,(R=t._stroke)!=null&&R.width){const P=t._stroke;a.lineWidth=P.width,a.miterLimit=P.miterLimit,a.lineJoin=P.join,a.lineCap=P.cap}a.font=l;let g,m;const M=t.dropShadow?2:1;for(let P=0;P<M;++P){const ie=t.dropShadow&&P===0,V=ie?Math.ceil(Math.max(1,_)+r*2):0,nt=V*n;if(ie){a.fillStyle="black",a.strokeStyle="black";const b=t.dropShadow,st=b.color,it=b.alpha;a.shadowColor=Be.shared.setValue(st).setAlpha(it).toRgbaString();const at=b.blur*n,ue=b.distance*n;a.shadowBlur=at,a.shadowOffsetX=Math.cos(b.angle)*ue,a.shadowOffsetY=Math.sin(b.angle)*ue+nt}else{if(a.fillStyle=t._fill?de(t._fill,a,u,r*2):null,(D=t._stroke)!=null&&D.width){const b=t._stroke.width*.5+r*2;a.strokeStyle=de(t._stroke,a,u,b)}a.shadowColor="black"}let ae=(c-x.fontSize)/2;c-x.fontSize<0&&(ae=0);const oe=((w=t._stroke)==null?void 0:w.width)??0;for(let b=0;b<d.length;b++)g=oe/2,m=oe/2+b*c+x.ascent+ae,t.align==="right"?g+=p-h[b]:t.align==="center"&&(g+=(p-h[b])/2),(B=t._stroke)!=null&&B.width&&this._drawLetterSpacing(d[b],t,s,g+r,m+r-V,!0),t._fill!==void 0&&this._drawLetterSpacing(d[b],t,s,g+r,m+r-V)}}_drawLetterSpacing(e,t,r,n,s,i=!1){const{context:a}=r,l=t.letterSpacing;let u=!1;if(F.experimentalLetterSpacingSupported&&(F.experimentalLetterSpacing?(a.letterSpacing=`${l}px`,a.textLetterSpacing=`${l}px`,u=!0):(a.letterSpacing="0px",a.textLetterSpacing="0px")),l===0||u){i?a.strokeText(e,n,s):a.fillText(e,n,s);return}let d=n;const c=F.graphemeSegmenter(e);let h=a.measureText(e).width,p=0;for(let x=0;x<c.length;++x){const _=c[x];i?a.strokeText(_,d,s):a.fillText(_,d,s);let g="";for(let m=x+1;m<c.length;++m)g+=c[m];p=a.measureText(g).width,d+=h-p+l,h=p}}}const H=new Bt,be="http://www.w3.org/2000/svg",ye="http://www.w3.org/1999/xhtml";class Le{constructor(){this.svgRoot=document.createElementNS(be,"svg"),this.foreignObject=document.createElementNS(be,"foreignObject"),this.domElement=document.createElementNS(ye,"div"),this.styleElement=document.createElementNS(ye,"style");const{foreignObject:e,svgRoot:t,styleElement:r,domElement:n}=this;e.setAttribute("width","10000"),e.setAttribute("height","10000"),e.style.overflow="hidden",t.appendChild(e),e.appendChild(r),e.appendChild(n),this.image=E.get().createImage()}destroy(){this.svgRoot.remove(),this.foreignObject.remove(),this.styleElement.remove(),this.domElement.remove(),this.image.src="",this.image.remove(),this.svgRoot=null,this.foreignObject=null,this.styleElement=null,this.domElement=null,this.image=null,this.canvasAndContext=null}}let Te;function Ft(o,e,t,r){r||(r=Te||(Te=new Le));const{domElement:n,styleElement:s,svgRoot:i}=r;n.innerHTML=`<style>${e.cssStyle};</style><div style='padding:0'>${o}</div>`,n.setAttribute("style","transform-origin: top left; display: inline-block"),t&&(s.textContent=t),document.body.appendChild(i);const a=n.getBoundingClientRect();i.remove();const l=e.padding*2;return{width:a.width-l,height:a.height-l}}class Gt{constructor(){this.batches=[],this.batched=!1}destroy(){this.batches.forEach(e=>{I.return(e)}),this.batches.length=0}}class Ve{constructor(e,t){this.state=W.for2d(),this.renderer=e,this._adaptor=t,this.renderer.runners.contextChange.add(this)}contextChange(){this._adaptor.contextChange(this.renderer)}validateRenderable(e){const t=e.context,r=!!e._gpuData,n=this.renderer.graphicsContext.updateGpuContext(t);return!!(n.isBatchable||r!==n.isBatchable)}addRenderable(e,t){const r=this.renderer.graphicsContext.updateGpuContext(e.context);e.didViewUpdate&&this._rebuild(e),r.isBatchable?this._addToBatcher(e,t):(this.renderer.renderPipes.batch.break(t),t.add(e))}updateRenderable(e){const r=this._getGpuDataForRenderable(e).batches;for(let n=0;n<r.length;n++){const s=r[n];s._batcher.updateElement(s)}}execute(e){if(!e.isRenderable)return;const t=this.renderer,r=e.context;if(!t.graphicsContext.getGpuContext(r).batches.length)return;const s=r.customShader||this._adaptor.shader;this.state.blendMode=e.groupBlendMode;const i=s.resources.localUniforms.uniforms;i.uTransformMatrix=e.groupTransform,i.uRound=t._roundPixels|e._roundPixels,L(e.groupColorAlpha,i.uColor,0),this._adaptor.execute(this,e)}_rebuild(e){const t=this._getGpuDataForRenderable(e),r=this.renderer.graphicsContext.updateGpuContext(e.context);t.destroy(),r.isBatchable&&this._updateBatchesForRenderable(e,t)}_addToBatcher(e,t){const r=this.renderer.renderPipes.batch,n=this._getGpuDataForRenderable(e).batches;for(let s=0;s<n.length;s++){const i=n[s];r.addToBatch(i,t)}}_getGpuDataForRenderable(e){return e._gpuData[this.renderer.uid]||this._initGpuDataForRenderable(e)}_initGpuDataForRenderable(e){const t=new Gt;return e._gpuData[this.renderer.uid]=t,t}_updateBatchesForRenderable(e,t){const r=e.context,n=this.renderer.graphicsContext.getGpuContext(r),s=this.renderer._roundPixels|e._roundPixels;t.batches=n.batches.map(i=>{const a=I.get(lt);return i.copyTo(a),a.renderable=e,a.roundPixels=s,a})}destroy(){this.renderer=null,this._adaptor.destroy(),this._adaptor=null,this.state=null}}Ve.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"graphics"};class se{constructor(){this.batcherName="default",this.packAsQuad=!1,this.indexOffset=0,this.attributeOffset=0,this.roundPixels=0,this._batcher=null,this._batch=null,this._textureMatrixUpdateId=-1,this._uvUpdateId=-1}get blendMode(){return this.renderable.groupBlendMode}get topology(){return this._topology||this.geometry.topology}set topology(e){this._topology=e}reset(){this.renderable=null,this.texture=null,this._batcher=null,this._batch=null,this.geometry=null,this._uvUpdateId=-1,this._textureMatrixUpdateId=-1}setTexture(e){this.texture!==e&&(this.texture=e,this._textureMatrixUpdateId=-1)}get uvs(){const t=this.geometry.getBuffer("aUV"),r=t.data;let n=r;const s=this.texture.textureMatrix;return s.isSimple||(n=this._transformedUvs,(this._textureMatrixUpdateId!==s._updateID||this._uvUpdateId!==t._updateID)&&((!n||n.length<r.length)&&(n=this._transformedUvs=new Float32Array(r.length)),this._textureMatrixUpdateId=s._updateID,this._uvUpdateId=t._updateID,s.multiplyUvs(r,n))),n}get positions(){return this.geometry.positions}get indices(){return this.geometry.indices}get color(){return this.renderable.groupColorAlpha}get groupTransform(){return this.renderable.groupTransform}get attributeSize(){return this.geometry.positions.length/2}get indexSize(){return this.geometry.indices.length}}class ve{destroy(){}}class He{constructor(e,t){this.localUniforms=new G({uTransformMatrix:{value:new v,type:"mat3x3<f32>"},uColor:{value:new Float32Array([1,1,1,1]),type:"vec4<f32>"},uRound:{value:0,type:"f32"}}),this.localUniformsBindGroup=new Re({0:this.localUniforms}),this.renderer=e,this._adaptor=t,this._adaptor.init()}validateRenderable(e){const t=this._getMeshData(e),r=t.batched,n=e.batched;if(t.batched=n,r!==n)return!0;if(n){const s=e._geometry;if(s.indices.length!==t.indexSize||s.positions.length!==t.vertexSize)return t.indexSize=s.indices.length,t.vertexSize=s.positions.length,!0;const i=this._getBatchableMesh(e);return i.texture.uid!==e._texture.uid&&(i._textureMatrixUpdateId=-1),!i._batcher.checkAndUpdateTexture(i,e._texture)}return!1}addRenderable(e,t){var s,i;const r=this.renderer.renderPipes.batch,n=this._getMeshData(e);if(e.didViewUpdate&&(n.indexSize=(s=e._geometry.indices)==null?void 0:s.length,n.vertexSize=(i=e._geometry.positions)==null?void 0:i.length),n.batched){const a=this._getBatchableMesh(e);a.setTexture(e._texture),a.geometry=e._geometry,r.addToBatch(a,t)}else r.break(t),t.add(e)}updateRenderable(e){if(e.batched){const t=this._getBatchableMesh(e);t.setTexture(e._texture),t.geometry=e._geometry,t._batcher.updateElement(t)}}execute(e){if(!e.isRenderable)return;e.state.blendMode=re(e.groupBlendMode,e.texture._source);const t=this.localUniforms;t.uniforms.uTransformMatrix=e.groupTransform,t.uniforms.uRound=this.renderer._roundPixels|e._roundPixels,t.update(),L(e.groupColorAlpha,t.uniforms.uColor,0),this._adaptor.execute(this,e)}_getMeshData(e){var t,r;return(t=e._gpuData)[r=this.renderer.uid]||(t[r]=new ve),e._gpuData[this.renderer.uid].meshData||this._initMeshData(e)}_initMeshData(e){return e._gpuData[this.renderer.uid].meshData={batched:e.batched,indexSize:0,vertexSize:0},e._gpuData[this.renderer.uid].meshData}_getBatchableMesh(e){var t,r;return(t=e._gpuData)[r=this.renderer.uid]||(t[r]=new ve),e._gpuData[this.renderer.uid].batchableMesh||this._initBatchableMesh(e)}_initBatchableMesh(e){const t=new se;return t.renderable=e,t.setTexture(e._texture),t.transform=e.groupTransform,t.roundPixels=this.renderer._roundPixels|e._roundPixels,e._gpuData[this.renderer.uid].batchableMesh=t,t}destroy(){this.localUniforms=null,this.localUniformsBindGroup=null,this._adaptor.destroy(),this._adaptor=null,this.renderer=null}}He.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"mesh"};class Dt{execute(e,t){const r=e.state,n=e.renderer,s=t.shader||e.defaultShader;s.resources.uTexture=t.texture._source,s.resources.uniforms=e.localUniforms;const i=n.gl,a=e.getBuffers(t);n.shader.bind(s),n.state.set(r),n.geometry.bind(a.geometry,s.glProgram);const u=a.geometry.indexBuffer.data.BYTES_PER_ELEMENT===2?i.UNSIGNED_SHORT:i.UNSIGNED_INT;i.drawElements(i.TRIANGLES,t.particleChildren.length*6,u,0)}}class At{execute(e,t){const r=e.renderer,n=t.shader||e.defaultShader;n.groups[0]=r.renderPipes.uniformBatch.getUniformBindGroup(e.localUniforms,!0),n.groups[1]=r.texture.getTextureBindGroup(t.texture);const s=e.state,i=e.getBuffers(t);r.encoder.draw({geometry:i.geometry,shader:t.shader||e.defaultShader,state:s,size:t.particleChildren.length*6})}}function we(o,e=null){const t=o*6;if(t>65535?e||(e=new Uint32Array(t)):e||(e=new Uint16Array(t)),e.length!==t)throw new Error(`Out buffer length is incorrect, got ${e.length} and expected ${t}`);for(let r=0,n=0;r<t;r+=6,n+=4)e[r+0]=n+0,e[r+1]=n+1,e[r+2]=n+2,e[r+3]=n+0,e[r+4]=n+2,e[r+5]=n+3;return e}function kt(o){return{dynamicUpdate:Ce(o,!0),staticUpdate:Ce(o,!1)}}function Ce(o,e){const t=[];t.push(`

        var index = 0;

        for (let i = 0; i < ps.length; ++i)
        {
            const p = ps[i];

            `);let r=0;for(const s in o){const i=o[s];if(e!==i.dynamic)continue;t.push(`offset = index + ${r}`),t.push(i.code);const a=Q(i.format);r+=a.stride/4}t.push(`
            index += stride * 4;
        }
    `),t.unshift(`
        var stride = ${r};
    `);const n=t.join(`
`);return new Function("ps","f32v","u32v",n)}class zt{constructor(e){this._size=0,this._generateParticleUpdateCache={};const t=this._size=e.size??1e3,r=e.properties;let n=0,s=0;for(const d in r){const c=r[d],h=Q(c.format);c.dynamic?s+=h.stride:n+=h.stride}this._dynamicStride=s/4,this._staticStride=n/4,this.staticAttributeBuffer=new A(t*4*n),this.dynamicAttributeBuffer=new A(t*4*s),this.indexBuffer=we(t);const i=new Ue;let a=0,l=0;this._staticBuffer=new he({data:new Float32Array(1),label:"static-particle-buffer",shrinkToFit:!1,usage:k.VERTEX|k.COPY_DST}),this._dynamicBuffer=new he({data:new Float32Array(1),label:"dynamic-particle-buffer",shrinkToFit:!1,usage:k.VERTEX|k.COPY_DST});for(const d in r){const c=r[d],h=Q(c.format);c.dynamic?(i.addAttribute(c.attributeName,{buffer:this._dynamicBuffer,stride:this._dynamicStride*4,offset:a*4,format:c.format}),a+=h.size):(i.addAttribute(c.attributeName,{buffer:this._staticBuffer,stride:this._staticStride*4,offset:l*4,format:c.format}),l+=h.size)}i.addIndex(this.indexBuffer);const u=this.getParticleUpdate(r);this._dynamicUpload=u.dynamicUpdate,this._staticUpload=u.staticUpdate,this.geometry=i}getParticleUpdate(e){const t=Ot(e);return this._generateParticleUpdateCache[t]?this._generateParticleUpdateCache[t]:(this._generateParticleUpdateCache[t]=this.generateParticleUpdate(e),this._generateParticleUpdateCache[t])}generateParticleUpdate(e){return kt(e)}update(e,t){e.length>this._size&&(t=!0,this._size=Math.max(e.length,this._size*1.5|0),this.staticAttributeBuffer=new A(this._size*this._staticStride*4*4),this.dynamicAttributeBuffer=new A(this._size*this._dynamicStride*4*4),this.indexBuffer=we(this._size),this.geometry.indexBuffer.setDataWithSize(this.indexBuffer,this.indexBuffer.byteLength,!0));const r=this.dynamicAttributeBuffer;if(this._dynamicUpload(e,r.float32View,r.uint32View),this._dynamicBuffer.setDataWithSize(this.dynamicAttributeBuffer.float32View,e.length*this._dynamicStride*4,!0),t){const n=this.staticAttributeBuffer;this._staticUpload(e,n.float32View,n.uint32View),this._staticBuffer.setDataWithSize(n.float32View,e.length*this._staticStride*4,!0)}}destroy(){this._staticBuffer.destroy(),this._dynamicBuffer.destroy(),this.geometry.destroy()}}function Ot(o){const e=[];for(const t in o){const r=o[t];e.push(t,r.code,r.dynamic?"d":"s")}return e.join("_")}var Wt=`varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;
    gl_FragColor = color;
}`,It=`attribute vec2 aVertex;
attribute vec2 aUV;
attribute vec4 aColor;

attribute vec2 aPosition;
attribute float aRotation;

uniform mat3 uTranslationMatrix;
uniform float uRound;
uniform vec2 uResolution;
uniform vec4 uColor;

varying vec2 vUV;
varying vec4 vColor;

vec2 roundPixels(vec2 position, vec2 targetSize)
{       
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

void main(void){
    float cosRotation = cos(aRotation);
    float sinRotation = sin(aRotation);
    float x = aVertex.x * cosRotation - aVertex.y * sinRotation;
    float y = aVertex.x * sinRotation + aVertex.y * cosRotation;

    vec2 v = vec2(x, y);
    v = v + aPosition;

    gl_Position = vec4((uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

    if(uRound == 1.0)
    {
        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
    }

    vUV = aUV;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uColor;
}
`,Pe=`
struct ParticleUniforms {
  uTranslationMatrix:mat3x3<f32>,
  uColor:vec4<f32>,
  uRound:f32,
  uResolution:vec2<f32>,
};

fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>
{
  return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

@group(0) @binding(0) var<uniform> uniforms: ParticleUniforms;

@group(1) @binding(0) var uTexture: texture_2d<f32>;
@group(1) @binding(1) var uSampler : sampler;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) color : vec4<f32>,
  };
@vertex
fn mainVertex(
  @location(0) aVertex: vec2<f32>,
  @location(1) aPosition: vec2<f32>,
  @location(2) aUV: vec2<f32>,
  @location(3) aColor: vec4<f32>,
  @location(4) aRotation: f32,
) -> VSOutput {
  
   let v = vec2(
       aVertex.x * cos(aRotation) - aVertex.y * sin(aRotation),
       aVertex.x * sin(aRotation) + aVertex.y * cos(aRotation)
   ) + aPosition;

   var position = vec4((uniforms.uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

   if(uniforms.uRound == 1.0) {
       position = vec4(roundPixels(position.xy, uniforms.uResolution), position.zw);
   }

    let vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uniforms.uColor;

  return VSOutput(
   position,
   aUV,
   vColor,
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @builtin(position) position: vec4<f32>,
) -> @location(0) vec4<f32> {

    var sample = textureSample(uTexture, uSampler, uv) * color;
   
    return sample;
}`;class Et extends ne{constructor(){const e=ct.from({vertex:It,fragment:Wt}),t=dt.from({fragment:{source:Pe,entryPoint:"mainFragment"},vertex:{source:Pe,entryPoint:"mainVertex"}});super({glProgram:e,gpuProgram:t,resources:{uTexture:S.WHITE.source,uSampler:new J({}),uniforms:{uTranslationMatrix:{value:new v,type:"mat3x3<f32>"},uColor:{value:new Be(16777215),type:"vec4<f32>"},uRound:{value:1,type:"f32"},uResolution:{value:[0,0],type:"vec2<f32>"}}}})}}class Ye{constructor(e,t){this.state=W.for2d(),this.localUniforms=new G({uTranslationMatrix:{value:new v,type:"mat3x3<f32>"},uColor:{value:new Float32Array(4),type:"vec4<f32>"},uRound:{value:1,type:"f32"},uResolution:{value:[0,0],type:"vec2<f32>"}}),this.renderer=e,this.adaptor=t,this.defaultShader=new Et,this.state=W.for2d()}validateRenderable(e){return!1}addRenderable(e,t){this.renderer.renderPipes.batch.break(t),t.add(e)}getBuffers(e){return e._gpuData[this.renderer.uid]||this._initBuffer(e)}_initBuffer(e){return e._gpuData[this.renderer.uid]=new zt({size:e.particleChildren.length,properties:e._properties}),e._gpuData[this.renderer.uid]}updateRenderable(e){}execute(e){const t=e.particleChildren;if(t.length===0)return;const r=this.renderer,n=this.getBuffers(e);e.texture||(e.texture=t[0].texture);const s=this.state;n.update(t,e._childrenDirty),e._childrenDirty=!1,s.blendMode=re(e.blendMode,e.texture._source);const i=this.localUniforms.uniforms,a=i.uTranslationMatrix;e.worldTransform.copyTo(a),a.prepend(r.globalUniforms.globalUniformData.projectionMatrix),i.uResolution=r.globalUniforms.globalUniformData.resolution,i.uRound=r._roundPixels|e._roundPixels,L(e.groupColorAlpha,i.uColor,0),this.adaptor.execute(this,e)}destroy(){this.renderer=null,this.defaultShader&&(this.defaultShader.destroy(),this.defaultShader=null)}}class Xe extends Ye{constructor(e){super(e,new Dt)}}Xe.extension={type:[f.WebGLPipes],name:"particle"};class Ke extends Ye{constructor(e){super(e,new At)}}Ke.extension={type:[f.WebGPUPipes],name:"particle"};const $e=class je extends ht{constructor(e={}){e={...je.defaultOptions,...e},super({width:e.width,height:e.height,verticesX:4,verticesY:4}),this.update(e)}update(e){var t,r;this.width=e.width??this.width,this.height=e.height??this.height,this._originalWidth=e.originalWidth??this._originalWidth,this._originalHeight=e.originalHeight??this._originalHeight,this._leftWidth=e.leftWidth??this._leftWidth,this._rightWidth=e.rightWidth??this._rightWidth,this._topHeight=e.topHeight??this._topHeight,this._bottomHeight=e.bottomHeight??this._bottomHeight,this._anchorX=(t=e.anchor)==null?void 0:t.x,this._anchorY=(r=e.anchor)==null?void 0:r.y,this.updateUvs(),this.updatePositions()}updatePositions(){const e=this.positions,{width:t,height:r,_leftWidth:n,_rightWidth:s,_topHeight:i,_bottomHeight:a,_anchorX:l,_anchorY:u}=this,d=n+s,c=t>d?1:t/d,h=i+a,p=r>h?1:r/h,x=Math.min(c,p),_=l*t,g=u*r;e[0]=e[8]=e[16]=e[24]=-_,e[2]=e[10]=e[18]=e[26]=n*x-_,e[4]=e[12]=e[20]=e[28]=t-s*x-_,e[6]=e[14]=e[22]=e[30]=t-_,e[1]=e[3]=e[5]=e[7]=-g,e[9]=e[11]=e[13]=e[15]=i*x-g,e[17]=e[19]=e[21]=e[23]=r-a*x-g,e[25]=e[27]=e[29]=e[31]=r-g,this.getBuffer("aPosition").update()}updateUvs(){const e=this.uvs;e[0]=e[8]=e[16]=e[24]=0,e[1]=e[3]=e[5]=e[7]=0,e[6]=e[14]=e[22]=e[30]=1,e[25]=e[27]=e[29]=e[31]=1;const t=1/this._originalWidth,r=1/this._originalHeight;e[2]=e[10]=e[18]=e[26]=t*this._leftWidth,e[9]=e[11]=e[13]=e[15]=r*this._topHeight,e[4]=e[12]=e[20]=e[28]=1-t*this._rightWidth,e[17]=e[19]=e[21]=e[23]=1-r*this._bottomHeight,this.getBuffer("aUV").update()}};$e.defaultOptions={width:100,height:100,leftWidth:10,topHeight:10,rightWidth:10,bottomHeight:10,originalWidth:100,originalHeight:100};let Lt=$e;class Vt extends se{constructor(){super(),this.geometry=new Lt}destroy(){this.geometry.destroy()}}class qe{constructor(e){this._renderer=e}addRenderable(e,t){const r=this._getGpuSprite(e);e.didViewUpdate&&this._updateBatchableSprite(e,r),this._renderer.renderPipes.batch.addToBatch(r,t)}updateRenderable(e){const t=this._getGpuSprite(e);e.didViewUpdate&&this._updateBatchableSprite(e,t),t._batcher.updateElement(t)}validateRenderable(e){const t=this._getGpuSprite(e);return!t._batcher.checkAndUpdateTexture(t,e._texture)}_updateBatchableSprite(e,t){t.geometry.update(e),t.setTexture(e._texture)}_getGpuSprite(e){return e._gpuData[this._renderer.uid]||this._initGPUSprite(e)}_initGPUSprite(e){const t=e._gpuData[this._renderer.uid]=new Vt,r=t;return r.renderable=e,r.transform=e.groupTransform,r.texture=e._texture,r.roundPixels=this._renderer._roundPixels|e._roundPixels,e.didViewUpdate||this._updateBatchableSprite(e,r),t}destroy(){this._renderer=null}}qe.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"nineSliceSprite"};const Ht={name:"tiling-bit",vertex:{header:`
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,main:`
            uv = (tilingUniforms.uTextureTransform * vec3(uv, 1.0)).xy;

            position = (position - tilingUniforms.uSizeAnchor.zw) * tilingUniforms.uSizeAnchor.xy;
        `},fragment:{header:`
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,main:`

            var coord = vUV + ceil(tilingUniforms.uClampOffset - vUV);
            coord = (tilingUniforms.uMapCoord * vec3(coord, 1.0)).xy;
            var unclamped = coord;
            coord = clamp(coord, tilingUniforms.uClampFrame.xy, tilingUniforms.uClampFrame.zw);

            var bias = 0.;

            if(unclamped.x == coord.x && unclamped.y == coord.y)
            {
                bias = -32.;
            }

            outColor = textureSampleBias(uTexture, uSampler, coord, bias);
        `}},Yt={name:"tiling-bit",vertex:{header:`
            uniform mat3 uTextureTransform;
            uniform vec4 uSizeAnchor;

        `,main:`
            uv = (uTextureTransform * vec3(aUV, 1.0)).xy;

            position = (position - uSizeAnchor.zw) * uSizeAnchor.xy;
        `},fragment:{header:`
            uniform sampler2D uTexture;
            uniform mat3 uMapCoord;
            uniform vec4 uClampFrame;
            uniform vec2 uClampOffset;
        `,main:`

        vec2 coord = vUV + ceil(uClampOffset - vUV);
        coord = (uMapCoord * vec3(coord, 1.0)).xy;
        vec2 unclamped = coord;
        coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

        outColor = texture(uTexture, coord, unclamped == coord ? 0.0 : -32.0);// lod-bias very negative to force lod 0

        `}};let Y,X;class Xt extends ne{constructor(){Y??(Y=Fe({name:"tiling-sprite-shader",bits:[wt,Ht,Ge]})),X??(X=De({name:"tiling-sprite-shader",bits:[Ct,Yt,Ae]}));const e=new G({uMapCoord:{value:new v,type:"mat3x3<f32>"},uClampFrame:{value:new Float32Array([0,0,1,1]),type:"vec4<f32>"},uClampOffset:{value:new Float32Array([0,0]),type:"vec2<f32>"},uTextureTransform:{value:new v,type:"mat3x3<f32>"},uSizeAnchor:{value:new Float32Array([100,100,.5,.5]),type:"vec4<f32>"}});super({glProgram:X,gpuProgram:Y,resources:{localUniforms:new G({uTransformMatrix:{value:new v,type:"mat3x3<f32>"},uColor:{value:new Float32Array([1,1,1,1]),type:"vec4<f32>"},uRound:{value:0,type:"f32"}}),tilingUniforms:e,uTexture:S.EMPTY.source,uSampler:S.EMPTY.source.style}})}updateUniforms(e,t,r,n,s,i){const a=this.resources.tilingUniforms,l=i.width,u=i.height,d=i.textureMatrix,c=a.uniforms.uTextureTransform;c.set(r.a*l/e,r.b*l/t,r.c*u/e,r.d*u/t,r.tx/e,r.ty/t),c.invert(),a.uniforms.uMapCoord=d.mapCoord,a.uniforms.uClampFrame=d.uClampFrame,a.uniforms.uClampOffset=d.uClampOffset,a.uniforms.uTextureTransform=c,a.uniforms.uSizeAnchor[0]=e,a.uniforms.uSizeAnchor[1]=t,a.uniforms.uSizeAnchor[2]=n,a.uniforms.uSizeAnchor[3]=s,i&&(this.resources.uTexture=i.source,this.resources.uSampler=i.source.style)}}class Kt extends ke{constructor(){super({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])})}}function $t(o,e){const t=o.anchor.x,r=o.anchor.y;e[0]=-t*o.width,e[1]=-r*o.height,e[2]=(1-t)*o.width,e[3]=-r*o.height,e[4]=(1-t)*o.width,e[5]=(1-r)*o.height,e[6]=-t*o.width,e[7]=(1-r)*o.height}function jt(o,e,t,r){let n=0;const s=o.length/e,i=r.a,a=r.b,l=r.c,u=r.d,d=r.tx,c=r.ty;for(t*=e;n<s;){const h=o[t],p=o[t+1];o[t]=i*h+l*p+d,o[t+1]=a*h+u*p+c,t+=e,n++}}function qt(o,e){const t=o.texture,r=t.frame.width,n=t.frame.height;let s=0,i=0;o.applyAnchorToTexture&&(s=o.anchor.x,i=o.anchor.y),e[0]=e[6]=-s,e[2]=e[4]=1-s,e[1]=e[3]=-i,e[5]=e[7]=1-i;const a=v.shared;a.copyFrom(o._tileTransform.matrix),a.tx/=o.width,a.ty/=o.height,a.invert(),a.scale(o.width/r,o.height/n),jt(e,2,0,a)}const z=new Kt;class Nt{constructor(){this.canBatch=!0,this.geometry=new ke({indices:z.indices.slice(),positions:z.positions.slice(),uvs:z.uvs.slice()})}destroy(){var e;this.geometry.destroy(),(e=this.shader)==null||e.destroy()}}class Ne{constructor(e){this._state=W.default2d,this._renderer=e}validateRenderable(e){const t=this._getTilingSpriteData(e),r=t.canBatch;this._updateCanBatch(e);const n=t.canBatch;if(n&&n===r){const{batchableMesh:s}=t;return!s._batcher.checkAndUpdateTexture(s,e.texture)}return r!==n}addRenderable(e,t){const r=this._renderer.renderPipes.batch;this._updateCanBatch(e);const n=this._getTilingSpriteData(e),{geometry:s,canBatch:i}=n;if(i){n.batchableMesh||(n.batchableMesh=new se);const a=n.batchableMesh;e.didViewUpdate&&(this._updateBatchableMesh(e),a.geometry=s,a.renderable=e,a.transform=e.groupTransform,a.setTexture(e._texture)),a.roundPixels=this._renderer._roundPixels|e._roundPixels,r.addToBatch(a,t)}else r.break(t),n.shader||(n.shader=new Xt),this.updateRenderable(e),t.add(e)}execute(e){const{shader:t}=this._getTilingSpriteData(e);t.groups[0]=this._renderer.globalUniforms.bindGroup;const r=t.resources.localUniforms.uniforms;r.uTransformMatrix=e.groupTransform,r.uRound=this._renderer._roundPixels|e._roundPixels,L(e.groupColorAlpha,r.uColor,0),this._state.blendMode=re(e.groupBlendMode,e.texture._source),this._renderer.encoder.draw({geometry:z,shader:t,state:this._state})}updateRenderable(e){const t=this._getTilingSpriteData(e),{canBatch:r}=t;if(r){const{batchableMesh:n}=t;e.didViewUpdate&&this._updateBatchableMesh(e),n._batcher.updateElement(n)}else if(e.didViewUpdate){const{shader:n}=t;n.updateUniforms(e.width,e.height,e._tileTransform.matrix,e.anchor.x,e.anchor.y,e.texture)}}_getTilingSpriteData(e){return e._gpuData[this._renderer.uid]||this._initTilingSpriteData(e)}_initTilingSpriteData(e){const t=new Nt;return t.renderable=e,e._gpuData[this._renderer.uid]=t,t}_updateBatchableMesh(e){const t=this._getTilingSpriteData(e),{geometry:r}=t,n=e.texture.source.style;n.addressMode!=="repeat"&&(n.addressMode="repeat",n.update()),qt(e,r.uvs),$t(e,r.positions)}destroy(){this._renderer=null}_updateCanBatch(e){const t=this._getTilingSpriteData(e),r=e.texture;let n=!0;return this._renderer.type===te.WEBGL&&(n=this._renderer.context.supports.nonPowOf2wrapping),t.canBatch=r.textureMatrix.isSimple&&(n||r.source.isPowerOfTwo),t.canBatch}}Ne.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"tilingSprite"};const Qt={name:"local-uniform-msdf-bit",vertex:{header:`
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32,
                uRound:f32,
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,main:`
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,end:`
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `},fragment:{header:`
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
         `,main:`
            outColor = vec4<f32>(calculateMSDFAlpha(outColor, localUniforms.uColor, localUniforms.uDistance));
        `}},Jt={name:"local-uniform-msdf-bit",vertex:{header:`
            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,main:`
            vColor *= uColor;
            modelMatrix *= uTransformMatrix;
        `,end:`
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `},fragment:{header:`
            uniform float uDistance;
         `,main:`
            outColor = vec4(calculateMSDFAlpha(outColor, vColor, uDistance));
        `}},Zt={name:"msdf-bit",fragment:{header:`
            fn calculateMSDFAlpha(msdfColor:vec4<f32>, shapeColor:vec4<f32>, distance:f32) -> f32 {

                // MSDF
                var median = msdfColor.r + msdfColor.g + msdfColor.b -
                    min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                    max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                var screenPxDistance = distance * (median - 0.5);
                var alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                var luma: f32 = dot(shapeColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
                var gamma: f32 = mix(1.0, 1.0 / 2.2, luma);
                var coverage: f32 = pow(shapeColor.a * alpha, gamma);

                return coverage;

            }
        `}},er={name:"msdf-bit",fragment:{header:`
            float calculateMSDFAlpha(vec4 msdfColor, vec4 shapeColor, float distance) {

                // MSDF
                float median = msdfColor.r + msdfColor.g + msdfColor.b -
                                min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                                max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                float screenPxDistance = distance * (median - 0.5);
                float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                float luma = dot(shapeColor.rgb, vec3(0.299, 0.587, 0.114));
                float gamma = mix(1.0, 1.0 / 2.2, luma);
                float coverage = pow(shapeColor.a * alpha, gamma);

                return coverage;
            }
        `}};let K,$;class tr extends ne{constructor(e){const t=new G({uColor:{value:new Float32Array([1,1,1,1]),type:"vec4<f32>"},uTransformMatrix:{value:new v,type:"mat3x3<f32>"},uDistance:{value:4,type:"f32"},uRound:{value:0,type:"f32"}});K??(K=Fe({name:"sdf-shader",bits:[ft,pt(e),Qt,Zt,Ge]})),$??($=De({name:"sdf-shader",bits:[mt,gt(e),Jt,er,Ae]})),super({glProgram:$,gpuProgram:K,resources:{localUniforms:t,batchSamplers:xt(e)}})}}class rr extends yt{destroy(){this.context.customShader&&this.context.customShader.destroy(),super.destroy()}}class Qe{constructor(e){this._renderer=e}validateRenderable(e){const t=this._getGpuBitmapText(e);return this._renderer.renderPipes.graphics.validateRenderable(t)}addRenderable(e,t){const r=this._getGpuBitmapText(e);Se(e,r),e._didTextUpdate&&(e._didTextUpdate=!1,this._updateContext(e,r)),this._renderer.renderPipes.graphics.addRenderable(r,t),r.context.customShader&&this._updateDistanceField(e)}updateRenderable(e){const t=this._getGpuBitmapText(e);Se(e,t),this._renderer.renderPipes.graphics.updateRenderable(t),t.context.customShader&&this._updateDistanceField(e)}_updateContext(e,t){const{context:r}=t,n=_t.getFont(e.text,e._style);r.clear(),n.distanceField.type!=="none"&&(r.customShader||(r.customShader=new tr(this._renderer.limits.maxBatchableTextures)));const s=F.graphemeSegmenter(e.text),i=e._style;let a=n.baseLineOffset;const l=bt(s,i,n,!0),u=i.padding,d=l.scale;let c=l.width,h=l.height+l.offsetY;i._stroke&&(c+=i._stroke.width/d,h+=i._stroke.width/d),r.translate(-e._anchor._x*c-u,-e._anchor._y*h-u).scale(d,d);const p=n.applyFillAsTint?i._fill.color:16777215;let x=n.fontMetrics.fontSize,_=n.lineHeight;i.lineHeight&&(x=i.fontSize/d,_=i.lineHeight/d);let g=(_-x)/2;g-n.baseLineOffset<0&&(g=0);for(let m=0;m<l.lines.length;m++){const M=l.lines[m];for(let R=0;R<M.charPositions.length;R++){const D=M.chars[R],w=n.chars[D];if(w!=null&&w.texture){const B=w.texture;r.texture(B,p||"black",Math.round(M.charPositions[R]+w.xOffset),Math.round(a+w.yOffset+g),B.orig.width,B.orig.height)}}a+=_}}_getGpuBitmapText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){const t=new rr;return e._gpuData[this._renderer.uid]=t,this._updateContext(e,t),t}_updateDistanceField(e){const t=this._getGpuBitmapText(e).context,r=e._style.fontFamily,n=Z.get(`${r}-bitmap`),{a:s,b:i,c:a,d:l}=e.groupTransform,u=Math.sqrt(s*s+i*i),d=Math.sqrt(a*a+l*l),c=(Math.abs(u)+Math.abs(d))/2,h=n.baseRenderedFontSize/e._style.fontSize,p=c*n.distanceField.range*(1/h);t.customShader.resources.localUniforms.uniforms.uDistance=p}destroy(){this._renderer=null}}Qe.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"bitmapText"};function Se(o,e){e.groupTransform=o.groupTransform,e.groupColorAlpha=o.groupColorAlpha,e.groupColor=o.groupColor,e.groupBlendMode=o.groupBlendMode,e.globalDisplayStatus=o.globalDisplayStatus,e.groupTransform=o.groupTransform,e.localDisplayStatus=o.localDisplayStatus,e.groupAlpha=o.groupAlpha,e._roundPixels=o._roundPixels}class nr extends ze{constructor(e){super(),this.generatingTexture=!1,this.currentKey="--",this._renderer=e,e.runners.resolutionChange.add(this)}resolutionChange(){const e=this.renderable;e._autoResolution&&e.onViewUpdate()}destroy(){const{htmlText:e}=this._renderer;e.getReferenceCount(this.currentKey)===null?e.returnTexturePromise(this.texturePromise):e.decreaseReferenceCount(this.currentKey),this._renderer.runners.resolutionChange.remove(this),this.texturePromise=null,this._renderer=null}}function ee(o,e){const{texture:t,bounds:r}=o,n=e._style._getFinalPadding();Tt(r,e._anchor,t);const s=e._anchor._x*n*2,i=e._anchor._y*n*2;r.minX-=n-s,r.minY-=n-i,r.maxX-=n-s,r.maxY-=n-i}class Je{constructor(e){this._renderer=e}validateRenderable(e){const t=this._getGpuText(e),r=e.styleKey;return t.currentKey!==r}addRenderable(e,t){const r=this._getGpuText(e);if(e._didTextUpdate){const n=e._autoResolution?this._renderer.resolution:e.resolution;(r.currentKey!==e.styleKey||e.resolution!==n)&&this._updateGpuText(e).catch(s=>{console.error(s)}),e._didTextUpdate=!1,ee(r,e)}this._renderer.renderPipes.batch.addToBatch(r,t)}updateRenderable(e){const t=this._getGpuText(e);t._batcher.updateElement(t)}async _updateGpuText(e){e._didTextUpdate=!1;const t=this._getGpuText(e);if(t.generatingTexture)return;const r=t.texturePromise;t.texturePromise=null,t.generatingTexture=!0,e._resolution=e._autoResolution?this._renderer.resolution:e.resolution;let n=this._renderer.htmlText.getTexturePromise(e);r&&(n=n.finally(()=>{this._renderer.htmlText.decreaseReferenceCount(t.currentKey),this._renderer.htmlText.returnTexturePromise(r)})),t.texturePromise=n,t.currentKey=e.styleKey,t.texture=await n;const s=e.renderGroup||e.parentRenderGroup;s&&(s.structureDidChange=!0),t.generatingTexture=!1,ee(t,e)}_getGpuText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){const t=new nr(this._renderer);return t.renderable=e,t.transform=e.groupTransform,t.texture=S.EMPTY,t.bounds={minX:0,maxX:1,minY:0,maxY:0},t.roundPixels=this._renderer._roundPixels|e._roundPixels,e._resolution=e._autoResolution?this._renderer.resolution:e.resolution,e._gpuData[this._renderer.uid]=t,t}destroy(){this._renderer=null}}Je.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"htmlText"};function sr(){const{userAgent:o}=E.get().getNavigator();return/^((?!chrome|android).)*safari/i.test(o)}const ir=new Me;function Ze(o,e,t,r){const n=ir;n.minX=0,n.minY=0,n.maxX=o.width/r|0,n.maxY=o.height/r|0;const s=T.getOptimalTexture(n.width,n.height,r,!1);return s.source.uploadMethodId="image",s.source.resource=o,s.source.alphaMode="premultiply-alpha-on-upload",s.frame.width=e/r,s.frame.height=t/r,s.source.emit("update",s.source),s.updateUvs(),s}function ar(o,e){const t=e.fontFamily,r=[],n={},s=/font-family:([^;"\s]+)/g,i=o.match(s);function a(l){n[l]||(r.push(l),n[l]=!0)}if(Array.isArray(t))for(let l=0;l<t.length;l++)a(t[l]);else a(t);i&&i.forEach(l=>{const u=l.split(":")[1].trim();a(u)});for(const l in e.tagStyles){const u=e.tagStyles[l].fontFamily;a(u)}return r}async function or(o){const t=await(await E.get().fetch(o)).blob(),r=new FileReader;return await new Promise((s,i)=>{r.onloadend=()=>s(r.result),r.onerror=i,r.readAsDataURL(t)})}async function ur(o,e){const t=await or(e);return`@font-face {
        font-family: "${o.fontFamily}";
        font-weight: ${o.fontWeight};
        font-style: ${o.fontStyle};
        src: url('${t}');
    }`}const j=new Map;async function lr(o){const e=o.filter(t=>Z.has(`${t}-and-url`)).map(t=>{if(!j.has(t)){const{entries:r}=Z.get(`${t}-and-url`),n=[];r.forEach(s=>{const i=s.url,l=s.faces.map(u=>({weight:u.weight,style:u.style}));n.push(...l.map(u=>ur({fontWeight:u.weight,fontStyle:u.style,fontFamily:t},i)))}),j.set(t,Promise.all(n).then(s=>s.join(`
`)))}return j.get(t)});return(await Promise.all(e)).join(`
`)}function cr(o,e,t,r,n){const{domElement:s,styleElement:i,svgRoot:a}=n;s.innerHTML=`<style>${e.cssStyle}</style><div style='padding:0;'>${o}</div>`,s.setAttribute("style",`transform: scale(${t});transform-origin: top left; display: inline-block`),i.textContent=r;const{width:l,height:u}=n.image;return a.setAttribute("width",l.toString()),a.setAttribute("height",u.toString()),new XMLSerializer().serializeToString(a)}function dr(o,e){const t=O.getOptimalCanvasAndContext(o.width,o.height,e),{context:r}=t;return r.clearRect(0,0,o.width,o.height),r.drawImage(o,0,0),t}function hr(o,e,t){return new Promise(async r=>{t&&await new Promise(n=>setTimeout(n,100)),o.onload=()=>{r()},o.src=`data:image/svg+xml;charset=utf8,${encodeURIComponent(e)}`,o.crossOrigin="anonymous"})}class et{constructor(e){this._activeTextures={},this._renderer=e,this._createCanvas=e.type===te.WEBGPU}getTexture(e){return this.getTexturePromise(e)}getManagedTexture(e){const t=e.styleKey;if(this._activeTextures[t])return this._increaseReferenceCount(t),this._activeTextures[t].promise;const r=this._buildTexturePromise(e).then(n=>(this._activeTextures[t].texture=n,n));return this._activeTextures[t]={texture:null,promise:r,usageCount:1},r}getReferenceCount(e){var t;return((t=this._activeTextures[e])==null?void 0:t.usageCount)??null}_increaseReferenceCount(e){this._activeTextures[e].usageCount++}decreaseReferenceCount(e){const t=this._activeTextures[e];t&&(t.usageCount--,t.usageCount===0&&(t.texture?this._cleanUp(t.texture):t.promise.then(r=>{t.texture=r,this._cleanUp(t.texture)}).catch(()=>{q("HTMLTextSystem: Failed to clean texture")}),this._activeTextures[e]=null))}getTexturePromise(e){return this._buildTexturePromise(e)}async _buildTexturePromise(e){const{text:t,style:r,resolution:n,textureStyle:s}=e,i=I.get(Le),a=ar(t,r),l=await lr(a),u=Ft(t,r,l,i),d=Math.ceil(Math.ceil(Math.max(1,u.width)+r.padding*2)*n),c=Math.ceil(Math.ceil(Math.max(1,u.height)+r.padding*2)*n),h=i.image,p=2;h.width=(d|0)+p,h.height=(c|0)+p;const x=cr(t,r,n,l,i);await hr(h,x,sr()&&a.length>0);const _=h;let g;this._createCanvas&&(g=dr(h,n));const m=Ze(g?g.canvas:_,h.width-p,h.height-p,n);return s&&(m.source.style=s),this._createCanvas&&(this._renderer.texture.initSource(m.source),O.returnCanvasAndContext(g)),I.return(i),m}returnTexturePromise(e){e.then(t=>{this._cleanUp(t)}).catch(()=>{q("HTMLTextSystem: Failed to clean texture")})}_cleanUp(e){T.returnTexture(e,!0),e.source.resource=null,e.source.uploadMethodId="unknown"}destroy(){this._renderer=null;for(const e in this._activeTextures)this._activeTextures[e]&&this.returnTexturePromise(this._activeTextures[e].promise);this._activeTextures=null}}et.extension={type:[f.WebGLSystem,f.WebGPUSystem,f.CanvasSystem],name:"htmlText"};class fr extends ze{constructor(e){super(),this._renderer=e,e.runners.resolutionChange.add(this)}resolutionChange(){const e=this.renderable;e._autoResolution&&e.onViewUpdate()}destroy(){const{canvasText:e}=this._renderer;e.getReferenceCount(this.currentKey)===null?e.returnTexture(this.texture):e.decreaseReferenceCount(this.currentKey),this._renderer.runners.resolutionChange.remove(this),this._renderer=null}}class tt{constructor(e){this._renderer=e}validateRenderable(e){const t=this._getGpuText(e),r=e.styleKey;return t.currentKey!==r?!0:e._didTextUpdate}addRenderable(e,t){const r=this._getGpuText(e);if(e._didTextUpdate){const n=e._autoResolution?this._renderer.resolution:e.resolution;(r.currentKey!==e.styleKey||e.resolution!==n)&&this._updateGpuText(e),e._didTextUpdate=!1}this._renderer.renderPipes.batch.addToBatch(r,t)}updateRenderable(e){const t=this._getGpuText(e);t._batcher.updateElement(t)}_updateGpuText(e){const t=this._getGpuText(e);t.texture&&this._renderer.canvasText.decreaseReferenceCount(t.currentKey),e._resolution=e._autoResolution?this._renderer.resolution:e.resolution,t.texture=this._renderer.canvasText.getManagedTexture(e),t.currentKey=e.styleKey,ee(t,e)}_getGpuText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){const t=new fr(this._renderer);return t.currentKey="--",t.renderable=e,t.transform=e.groupTransform,t.bounds={minX:0,maxX:1,minY:0,maxY:0},t.roundPixels=this._renderer._roundPixels|e._roundPixels,e._gpuData[this._renderer.uid]=t,t}destroy(){this._renderer=null}}tt.extension={type:[f.WebGLPipes,f.WebGPUPipes,f.CanvasPipes],name:"text"};class rt{constructor(e){this._activeTextures={},this._renderer=e}getTexture(e,t,r,n){typeof e=="string"&&(fe("8.0.0","CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments"),e={text:e,style:r,resolution:t}),e.style instanceof pe||(e.style=new pe(e.style)),e.textureStyle instanceof J||(e.textureStyle=new J(e.textureStyle)),typeof e.text!="string"&&(e.text=e.text.toString());const{text:s,style:i,textureStyle:a}=e,l=e.resolution??this._renderer.resolution,{frame:u,canvasAndContext:d}=H.getCanvasAndContext({text:s,style:i,resolution:l}),c=Ze(d.canvas,u.width,u.height,l);if(a&&(c.source.style=a),i.trim&&(u.pad(i.padding),c.frame.copyFrom(u),c.frame.scale(1/l),c.updateUvs()),i.filters){const h=this._applyFilters(c,i.filters);return this.returnTexture(c),H.returnCanvasAndContext(d),h}return this._renderer.texture.initSource(c._source),H.returnCanvasAndContext(d),c}returnTexture(e){const t=e.source;t.resource=null,t.uploadMethodId="unknown",t.alphaMode="no-premultiply-alpha",T.returnTexture(e,!0)}renderTextToCanvas(){fe("8.10.0","CanvasTextSystem.renderTextToCanvas: no longer supported, use CanvasTextSystem.getTexture instead")}getManagedTexture(e){e._resolution=e._autoResolution?this._renderer.resolution:e.resolution;const t=e.styleKey;if(this._activeTextures[t])return this._increaseReferenceCount(t),this._activeTextures[t].texture;const r=this.getTexture({text:e.text,style:e.style,resolution:e._resolution,textureStyle:e.textureStyle});return this._activeTextures[t]={texture:r,usageCount:1},r}decreaseReferenceCount(e){const t=this._activeTextures[e];t.usageCount--,t.usageCount===0&&(this.returnTexture(t.texture),this._activeTextures[e]=null)}getReferenceCount(e){var t;return((t=this._activeTextures[e])==null?void 0:t.usageCount)??null}_increaseReferenceCount(e){this._activeTextures[e].usageCount++}_applyFilters(e,t){const r=this._renderer.renderTarget.renderTarget,n=this._renderer.filter.generateFilteredTexture({texture:e,filters:t});return this._renderer.renderTarget.bind(r,!1),n}destroy(){this._renderer=null;for(const e in this._activeTextures)this._activeTextures[e]&&this.returnTexture(this._activeTextures[e].texture);this._activeTextures=null}}rt.extension={type:[f.WebGLSystem,f.WebGPUSystem,f.CanvasSystem],name:"canvasText"};y.add(Oe);y.add(We);y.add(Ve);y.add(vt);y.add(He);y.add(Xe);y.add(Ke);y.add(rt);y.add(tt);y.add(Qe);y.add(et);y.add(Je);y.add(Ne);y.add(qe);y.add(Ee);y.add(Ie);
