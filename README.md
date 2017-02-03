# CanvasDraw  canvas简易画板 /支持 amd

推荐使用新版本

## CanvasDraw 1.2.0  API

```
new CanvasDraw(el,{		//el必传 	//string "#id" || node==='CANVAS' dom对象
    'attr':undefined, 			//json——对象属性设置 :{width:500,height:500}  undefined   
    'lineWidth':4 ,				//number——画笔宽度 
    'strokeStyle':'#000',		//string——画笔颜色
    'scale':null,				//array 【x 缩放，y缩放】矫正父的缩放造成的偏针（自身变形不需要矫正）  -webkit-transform: scale(0.5,1)
    'initFn':function(_this){},		//fn(_this)——返回this 初始化回调
    'startFn':function(_this){},	//fn(_this)——返回this 按下回调
    'moveFn':function(_this){},		//fn(_this)——返回this 移动回调
    'endFn':function(_this){}		//fn(_this)——返回this 抬起回调
})

FU: 
	.getImg(true)	 获取图像- （传参取墨水范围图像） 反之取整个画布区域
	.clearRect(x,y,w,h)	清除图像(清楚区域)  不传参清理全画布
	
ATTR:
	.ink 	画布是否被画过
	.pos = {'x':0,'y':0}; 	//实时反映画笔相对画板上的位置
	.graffitiSize = {'xL':null,'xR':null,'yT':null,'yB':null};	//记录墨水区域的大小（有笔触区）
	
注意：
	* * 保证 canvas 对象在显示状态  创建对象 —— new CanvasDraw（） 【有得必有失，为了处理偏针  】
	scale 指针（缩放）矫正 是针对父级的缩放照成的偏针 ，直接真对canvas的缩放变形不需要该参数配置矫正。   

```

