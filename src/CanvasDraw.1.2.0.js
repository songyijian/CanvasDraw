/*
	CanvasDraw 1.2.0  canvas 简易画板 /支持 amd
	作者：songyijian 
	发布：2017.01.25
	
	API
		new CanvasDraw(el,{		//el必传 	//string "#id" || node==='CANVAS' 
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
*/
!function(){
	'sue strict'
	function CanvasDraw(el,o){
	    if ( typeof el !== 'undefined' && (typeof el ==='string' || el.nodeName === 'CANVAS')){
		    if(typeof el ==='string'){
		    	if(!document.querySelector(el)){
		    		console.error('look look el !!!') 
		    		return ; 
		    	};
			    this.el=document.querySelector(el);
			    
		    }else if(el.nodeName === 'CANVAS'){
		    	this.el= el;
		    }
	    }else{
	        console.error('look look el !!!') 
	        return ;   
	    };
	    
	    this.data={
	        'attr':o.attr||undefined,
	        'lineWidth':o.lineWidth ||4 ,
	        'strokeStyle':o.strokeStyle ||'#000',
	        'scale':o.scale || null,
	        'initFn':o.initFn||function(_this){},
	        'startFn':o.startFn||function(_this){},
	        'moveFn':o.moveFn||function(_this){},
	        'endFn':o.endFn||function(_this){}
	    };
	    
	    this.init();
	};


	CanvasDraw.prototype.init = function() {
	    var _this=this;
	    
		if (!window.getComputedStyle) {
		    window.getComputedStyle = function (el, pseudo) {
		        this.el = el;
		        this.getPropertyValue = function (prop) {
		            var re = /(\-([a-z]){1})/g;
		            if (prop === 'float') prop = 'styleFloat';
		            if (re.test(prop)) {
		                prop = prop.replace(re, function () {
		                    return arguments[2].toUpperCase();
		                });
		            }
		            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
		        };
		        return this;
		    };
		};
		if( this.data.attr !== 'undefined'){
	        var key ='';
	        for(var i in this.data.attr){
	            if(this.data.attr.hasOwnProperty(i)) { key = i };
	            this.el.setAttribute(key,this.data.attr[i]);
	        };
	    };
	    this.elMatrix =null;	//矩阵
    	if(getComputedStyle(this.el).transform!=='none'){
    		this.elMatrix =getComputedStyle(this.el).transform;
    		this.elMatrix = this.elMatrix.substring(6);
    		this.elMatrix = this.elMatrix.substring(1,this.elMatrix.length-1);
    		this.elMatrix = this.elMatrix.split(',');
    		
    		for (var i=0;i<this.elMatrix.length; i++) {
    			this.elMatrix[i] = parseFloat(this.elMatrix[i]);
    		};
    	}else{
    		this.elMatrix = [1, 0, 0, 1, 0, 0];
    	};
    	

    	if(this.data.scale && typeof this.data.scale==='object' && typeof this.data.scale.length === 'number'){
    		if(this.data.scale.length ===1){
    			this.elMatrix[0] = this.elMatrix[0]*this.data.scale[0];
    			this.elMatrix[3] = this.elMatrix[3]*this.data.scale[0];
    		}else{
    			this.elMatrix[0] = this.elMatrix[0]*this.data.scale[0];
    			this.elMatrix[3] = this.elMatrix[3]*this.data.scale[1];
    		};
    	};
 
    	
    	this.boderSize={
    		x : parseFloat( getComputedStyle(this.el)['border-left-width'] ),
    		y : parseFloat( getComputedStyle(this.el)['border-top-width'] )
    	};
    	
	    this.data.attr.width =  parseFloat( this.el.getAttribute('width') || 150 );
	    this.data.attr.height =  parseFloat( this.el.getAttribute('height') || 150 );
	    this.pos = {'x':0,'y':0}; 	//记录画笔相对画板上的位置
	    this.isStart = false; 		//是否按下状态
	    this.isMove = false; 		//是否 move状态
	    this.graffitiSize = {'xL':null,'xR':null,'yT':null,'yB':null};//记录所画区域的大小（有笔触的）
	    this.scrap = this.data.lineWidth/2;	//涂鸦区域技术矫正
	    this.ink = false;	 //画布上有没有墨水
	    
	    
		//事件处理 鼠标事件和触摸事件
	   /* this.browser : {
	        ie8 : (function () {
	            'use strict';
	            var rv = -1; 
	            if (navigator.appName === 'Microsoft Internet Explorer') {
	                var ua = navigator.userAgent;
	                var re = new RegExp(/MSIE ([0-9]{1,}[\.0-9]{0,})/);
	                if (re.exec(ua) !== null)
	                    rv = parseFloat(RegExp.$1);
	            }
	            return rv !== -1 && rv < 9;
	        })(),
	        ie10 : window.navigator.msPointerEnabled,
	        ie11 : window.navigator.pointerEnabled
	    };
	    
	    this.oevent={
	    	eStart:(function(){
	    	})()
	    }
	    
	    var   = ['mousedown', 'mousemove', 'mouseup'];
	    if (this.browser.ie10) desktopEvents = ['MSPointerDown', 'MSPointerMove', 'MSPointerUp'];
	    if (this.browser.ie11) desktopEvents = ['pointerdown', 'pointermove', 'pointerup'];
	
	    _this.touchEvents = {
	        touchStart : _this.support.touch || !params.simulateTouch  ? 'touchstart' : desktopEvents[0],
	        touchMove : _this.support.touch || !params.simulateTouch ? 'touchmove' : desktopEvents[1],
	        touchEnd : _this.support.touch || !params.simulateTouch ? 'touchend' : desktopEvents[2]
	    };*/

	    //this.next_pos = {}; //记录下一点画笔位置
	    
	    //偏移量处理 bi bi bi...
    	this.scrollTop=document.body.scrollTop;
		this.scrollLeft=document.body.scrollLeft;
		this.styleData=this.el.getBoundingClientRect();
    	this.correctTop = this.styleData.top + this.scrollTop + (this.boderSize.y*this.elMatrix[3]);  
    	this.correctLeft = this.styleData.left + this.scrollLeft + (this.boderSize.x*this.elMatrix[0]);
    	//console.log(getComputedStyle(this.el).transformOrigin)
    	
	    this.Context=this.el.getContext('2d');

	    //事件处理
	    this.el.addEventListener('touchstart',function(e){
	        e.preventDefault();
	        _this.isStart = true;
	        _this.data.startFn(_this);
	        _this.startEvent(e)
	    });
	    this.el.addEventListener('touchmove',function(e){
	        e.preventDefault();
	        _this.data.moveFn(_this);
	        _this.moveEvent(e)
	    });
	    this.el.addEventListener('touchend',function(e){
	        e.preventDefault();
	        _this.data.endFn(_this);
	        _this.endEvent(e);
	        _this.isStart = false;
	        _this.isMove = false;
	    });
	    
	    this.data.initFn(_this);
	    
	    return this;
	};

	CanvasDraw.prototype.startEvent=function(e){
	    e = e.changedTouches[0];
	    this.pos.x = (e.pageX - this.correctLeft )/this.elMatrix[0];
	    this.pos.y = (e.pageY - this.correctTop)/this.elMatrix[3];
     	//this.getGraffitiSize();

	    this.Context.beginPath();
	    this.Context.strokeStyle = this.data.strokeStyle;
	    this.Context.lineWidth = this.data.lineWidth;
	    this.Context.lineCap = "round"; 
	    this.Context.moveTo(this.pos.x,this.pos.y);
	    
	    if(this.graffitiSize.xL && this.graffitiSize.xR && this.graffitiSize.yT && this.graffitiSize.yB){
	    	this.graffitiSize.xL = this.graffitiSize.xL > this.pos.x-this.scrap ?  this.pos.x-this.scrap : this.graffitiSize.xL;
	    	this.graffitiSize.xR = this.graffitiSize.xR < this.pos.x+this.scrap ?  this.pos.x+this.scrap : this.graffitiSize.xR;
	    	this.graffitiSize.yT = this.graffitiSize.yT > this.pos.y-this.scrap ?  this.pos.y-this.scrap : this.graffitiSize.yT;
	    	this.graffitiSize.yB = this.graffitiSize.yB < this.pos.y+this.scrap ?  this.pos.y+this.scrap : this.graffitiSize.yB;
	    }else{
	    	this.graffitiSize.xL = this.pos.x - this.scrap;
	    	this.graffitiSize.xR = this.pos.x + this.scrap;
	    	this.graffitiSize.yT = this.pos.y - this.scrap;
	    	this.graffitiSize.yB = this.pos.y + this.scrap;
	    };
	    return this;
	};

	CanvasDraw.prototype.moveEvent=function(e){
	    e = e.changedTouches[0];
	    this.isMove = true;
	    this.pos.x = (e.pageX - this.correctLeft)/this.elMatrix[0];
	    this.pos.y = (e.pageY - this.correctTop)/this.elMatrix[3];
	    
	    if(this.graffitiSize.xL && this.graffitiSize.xR && this.graffitiSize.yT && this.graffitiSize.yB){
	    	this.graffitiSize.xL = this.graffitiSize.xL > this.pos.x-this.scrap ?  this.pos.x-this.scrap : this.graffitiSize.xL;
	    	this.graffitiSize.xR = this.graffitiSize.xR < this.pos.x+this.scrap ?  this.pos.x+this.scrap : this.graffitiSize.xR;
	    	this.graffitiSize.yT = this.graffitiSize.yT > this.pos.y-this.scrap ?  this.pos.y-this.scrap : this.graffitiSize.yT;
	    	this.graffitiSize.yB = this.graffitiSize.yB < this.pos.y+this.scrap ?  this.pos.y+this.scrap : this.graffitiSize.yB;
	    }else{
	    	this.graffitiSize.xL = this.pos.x - this.scrap;
	    	this.graffitiSize.xR = this.pos.x + this.scrap;
	    	this.graffitiSize.yT = this.pos.y - this.scrap;
	    	this.graffitiSize.yB = this.pos.y + this.scrap;
	    };
	    
	    this.Context.lineTo(this.pos.x,this.pos.y);
	    //并不合并
	    this.Context.stroke();
	    return this;
	};

	CanvasDraw.prototype.endEvent=function(e){
	    e = e.changedTouches[0];
        this.pos.x = (e.pageX - this.correctLeft)/this.elMatrix[0];
    	this.pos.y = (e.pageY - this.correctTop)/this.elMatrix[3];
	    if (this.isStart && !this.isMove) { //点击没有移动
	    	this.Context.arc(this.pos.x, this.pos.y, this.data.lineWidth / 1.7, 0, Math.PI * 2, true);
	    	this.Context.fillStyle=this.data.strokeStyle;
            this.Context.fill();
	    };
        this.ink = true;
	    this.isStart = this.isMove = false;
	    return this;
	};

	//获取图片
	CanvasDraw.prototype.getImg=function(t){
		var img = this.el.toDataURL();
	    if(!t){
		    return img;
	    }else{
	    	var mould = document.createElement('canvas')
	    		,ct;
	    		mould.setAttribute('width',this.graffitiSize.xR - this.graffitiSize.xL);
	    		mould.setAttribute('height',this.graffitiSize.yB - this.graffitiSize.yT);
		    	ct = mould.getContext('2d');
	    		//document.body.appendChild(mould);
		    	ct.drawImage(this.el, this.graffitiSize.xL, this.graffitiSize.yT, this.graffitiSize.xR - this.graffitiSize.xL, this.graffitiSize.yB - this.graffitiSize.yT, 0, 0,this.graffitiSize.xR - this.graffitiSize.xL, this.graffitiSize.yB - this.graffitiSize.yT);
	    	
	    	return mould.toDataURL();
	    }
	};
	//清理
	CanvasDraw.prototype.clearRect=function(x,y,w,h){
	    var x=x||0
	        ,y=y||0
	        ,w=w||this.data.attr.width
	        ,h=h||this.data.attr.height;
	        
	    if(x===0 && y===0 && w===this.data.attr.width && this.data.attr.height){
		    this.ink = false;
	    };
	    
	    this.Context.clearRect(x,y,w,h);
	    this.Context.closePath();
	    this.graffitiSize = {'xL':0,'xR':0,'yT':0,'yB':0};//清理掉
	    return this;
	};
	
	window.CanvasDraw = CanvasDraw;
}()
if (typeof(module) !== 'undefined'){
    module.exports = window.CanvasDraw;
}else if (typeof define === 'function' && define.amd) {
    define([], function () {
        'use strict';
        return window.CanvasDraw;
    });
}            