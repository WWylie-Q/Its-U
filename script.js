"use strict";
{
	////////////////////////////////////////////////////////////////
	const canvas = {
		init() {
			this.elem = document.querySelector("canvas");
			const gl = this.elem.getContext("webgl", { alpha: false });
			const vertexShader = gl.createShader(gl.VERTEX_SHADER);
			const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(vertexShader,	`
				uniform mat4 camProj, camView;
				attribute vec3 aPosition, aNormal, aColor;
				varying vec3 vColor;
				const vec3 lightDir = vec3(0, 0, 1);
				void main(void) {
					vec3 normal = mat3(camView) * aNormal;
					vec4 pos = camView * vec4(aPosition, 1.0);
					vColor = aColor * max(dot(normal, normalize(lightDir - pos.xyz)), 0.2);
					gl_Position = camProj * pos; 
				}
			`);
			gl.shaderSource(fragmentShader,	`
				precision highp float;
				varying vec3 vColor;
				void main(void) {
					gl_FragColor = vec4(vColor, 1.0);
				}
			`);
			gl.compileShader(vertexShader);
			gl.compileShader(fragmentShader);
			this.program = gl.createProgram();
			gl.attachShader(this.program, vertexShader);
			gl.attachShader(this.program, fragmentShader);
			gl.linkProgram(this.program);
			gl.useProgram(this.program);
			return gl;
		},
		resize() {
			this.width = this.elem.width = this.elem.offsetWidth;
			this.height = this.elem.height = this.elem.offsetHeight;
			camera.proj.perspective(60, this.width / this.height).load();
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		}
	};
	////////////////////////////////////////////////////////////////
	const Mat4 = class {
		constructor(program, uName) {
			this.u = gl.getUniformLocation(program, uName);
			this.data = new Float32Array([
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1
			]);
		}
		identity() {
			const d = this.data;
			d[0] = 1;
			d[1] = 0;
			d[2] = 0;
			d[3] = 0;
			d[4] = 0;
			d[5] = 1;
			d[6] = 0;
			d[7] = 0;
			d[8] = 0;
			d[9] = 0;
			d[10] = 1;
			d[11] = 0;
			d[12] = 0;
			d[13] = 0;
			d[14] = 0;
			d[15] = 1;
			return this;
		}
		translate(x, y, z) {
			const d = this.data;
			d[12] = d[0] * x + d[4] * y + d[8] * z + d[12];
			d[13] = d[1] * x + d[5] * y + d[9] * z + d[13];
			d[14] = d[2] * x + d[6] * y + d[10] * z + d[14];
			d[15] = d[3] * x + d[7] * y + d[11] * z + d[15];
			return this;
		}
		rotateX(angle) {
			const d = this.data;
			const s = Math.sin(angle);
			const c = Math.cos(angle);
			const a10 = d[4];
			const a11 = d[5];
			const a12 = d[6];
			const a13 = d[7];
			const a20 = d[8];
			const a21 = d[9];
			const a22 = d[10];
			const a23 = d[11];
			d[4] = a10 * c + a20 * s;
			d[5] = a11 * c + a21 * s;
			d[6] = a12 * c + a22 * s;
			d[7] = a13 * c + a23 * s;
			d[8] = a10 * -s + a20 * c;
			d[9] = a11 * -s + a21 * c;
			d[10] = a12 * -s + a22 * c;
			d[11] = a13 * -s + a23 * c;
			return this;
		}
		rotateY(angle) {
			const d = this.data;
			const s = Math.sin(angle);
			const c = Math.cos(angle);
			const a00 = d[0];
			const a01 = d[1];
			const a02 = d[2];
			const a03 = d[3];
			const a20 = d[8];
			const a21 = d[9];
			const a22 = d[10];
			const a23 = d[11];
			d[0] = a00 * c + a20 * -s;
			d[1] = a01 * c + a21 * -s;
			d[2] = a02 * c + a22 * -s;
			d[3] = a03 * c + a23 * -s;
			d[8] = a00 * s + a20 * c;
			d[9] = a01 * s + a21 * c;
			d[10] = a02 * s + a22 * c;
			d[11] = a03 * s + a23 * c;
			return this;
		}
		rotateZ(angle) {
			const d = this.data;
			const s = Math.sin(angle);
			const c = Math.cos(angle);
			const a00 = d[0];
			const a01 = d[1];
			const a02 = d[2];
			const a03 = d[3];
			const a10 = d[4];
			const a11 = d[5];
			const a12 = d[6];
			const a13 = d[7];
			d[0] = a00 * c + a10 * s;
			d[1] = a01 * c + a11 * s;
			d[2] = a02 * c + a12 * s;
			d[3] = a03 * c + a13 * s;
			d[4] = a00 * -s + a10 * c;
			d[5] = a01 * -s + a11 * c;
			d[6] = a02 * -s + a12 * c;
			d[7] = a03 * -s + a13 * c;
			return this;
		}
		perspective(fov, aspect) {
			const d = this.data;
			const near = 0.01;
			const far = 100;
			const top = near * Math.tan(fov * Math.PI / 360);
			const right = top * aspect;
			const left = -right;
			const bottom = -top;
			d[0] = 2 * near / (right - left);
			d[1] = 0;
			d[2] = 0;
			d[3] = 0;
			d[4] = 0;
			d[5] = 2 * near / (top - bottom);
			d[6] = 0;
			d[7] = 0;
			d[8] = (right + left) / (right - left);
			d[9] = (top + bottom) / (top - bottom);
			d[10] = -(far + near) / (far - near);
			d[11] = -1;
			d[12] = 0;
			d[13] = 0;
			d[14] = -(2 * far * near) / (far - near);
			d[15] = 0;
			return this;
		}
		load() {
			gl.uniformMatrix4fv(this.u, gl.FALSE, this.data);
			return this;
		}
	};
	////////////////////////////////////////////////////////////////
	const gl = canvas.init();
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	const camera = {
		proj: new Mat4(canvas.program, "camProj").load(),
		view: new Mat4(canvas.program, "camView").load()
	};
	canvas.resize();
	window.addEventListener("resize", () => canvas.resize(), false);
	////////////////////////////////////////////////////////////////
	const decode = () => {
		const img = document.getElementById("heightmap");
		const width = img.width;
		const height = img.height;
		const cmap = document.createElement("canvas");
		cmap.width = width;
		cmap.height = height;
		const cty = cmap.getContext("2d");
    cty.drawImage(img, 0, 0);
		const hmap = cty.getImageData(0, 0, width, height).data;
		// brillance
		for (let i = 0; i < width * height * 4; i += 4) {
			hmap[i + 3] = 0.34 * hmap[i] + 0.5 * hmap[i + 1] + 0.16 * hmap[i + 2];
		}
		let vertices = new Float32Array(6000000);
		let iV = 0;
		const cube = (x, z, l, h, w, r, g, b) => [
			x,h,z,0,1,0,r,g,b,x,h,z+w,0,1,0,r,g,b,x+l,h,z+w,0,1,0,r,g,b,x,h,z,0,1,0,r,g,b,x+l,h,z+w,0,1,0,r,g,b,x+l,h,z,0,1,0,r,g,b,
			x,0,z,-1,0,0,r,g,b,x,0,z+w,-1,0,0,r,g,b,x,h,z+w,-1,0,0,r,g,b,x,0,z,-1,0,0,r,g,b,x,h,z+w,-1,0,0,r,g,b,x,h,z,-1,0,0,r,g,b,
			x+l,0,z,1,0,0,r,g,b,x+l,h,z,1,0,0,r,g,b,x+l,h,z+w,1,0,0,r,g,b,x+l,0,z,1,0,0,r,g,b,x+l,h,z+w,1,0,0,r,g,b,x+l,0,z+w,1,0,0,r,g,b,
			x,0,z,0,0,-1,r,g,b,x,h,z,0,0,-1,r,g,b,x+l,h,z,0,0,-1,r,g,b,x,0,z,0,0,-1,r,g,b,x+l,h,z,0,0,-1,r,g,b,x+l,0,z,0,0,-1,r,g,b,
			x,0,z+w,0,0,1,r,g,b,x+l,0,z+w,0,0,1,r,g,b,x+l,h,z+w,0,0,1,r,g,b,x,0,z+w,0,0,1,r,g,b,x+l,h,z+w,0,0,1,r,g,b,x,h,z+w,0,0,1,r,g,b
		];
		const attribute = (program, name, data, size, stride, offset) => {
			if (data !== null) {
				const buffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
				gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
			}
			const index = gl.getAttribLocation(program, name);
			gl.enableVertexAttribArray(index);
			gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset);
		};
		const increaseArray = (oldArray) => {
			const newArray = new Float32Array(oldArray.length * 1.25);
			newArray.set(oldArray);
			return newArray;
		};
		const concat = (a1, a2, index) => {
			if (index + a2.length > vertices.length) vertices = increaseArray(vertices);
			for (let i = 0, l = a2.length; i < l; i++) {
				a1[index++] = a2[i];
			}
			return index;
		};
		const Rect = class {
			constructor(x0, y0, w0, h0) {
				this.x = x0;
				this.y = y0;
				this.w = w0;
				this.h = h0;
				x0 = Math.floor(x0);
				y0 = Math.floor(y0);
				w0 = Math.ceil(w0);
				h0 = Math.ceil(h0);
				const n = w0 * h0;
				let r = 0, g = 0, b = 0, l = 0;
				for (let x = x0; x < x0 + w0; x++) {
					for (let y = y0; y < y0 + h0; y++) {
						const p = (y * width + x) * 4;
						r += hmap[p + 0];
						g += hmap[p + 1];
						b += hmap[p + 2];
						l += hmap[p + 3];
					}
				}
				// average colors
				this.r = (r / n)|0;
				this.g = (g / n)|0;
				this.b = (b / n)|0;
				this.l = (l / n)|0;
				// standard deviation
				let sd = 0;
				for (let x = x0; x < x0 + w0; x++) {
					for (let y = y0; y < y0 + h0; y++) {
						const l = hmap[(y * width + x) * 4 + 3] - this.l;
						sd += (l * l);
					}
				}
				this.sd = Math.sqrt(sd / n);
			}
			draw() {
				if (this.l > 1) iV = concat(vertices, cube(
					(this.x - width * 0.5) * 0.1, 
					(this.y - height * 0.5) * 0.1, 
					this.w * 0.1, 
					this.l * 0.02, 
					this.h * 0.1,
					this.r / 256,
					this.g / 256,
					this.b / 256
				), iV);
			}
		};
		const rect = new Rect(0, 0, width, height);
		const divide = (rect) => {
			if (rect.w > 1 || rect.h > 1) {
				if (rect.sd > 8) {
					const hw = rect.w * 0.5;
					const hh = rect.h * 0.5;
					divide(new Rect(rect.x, rect.y, hw, hh));
					divide(new Rect(rect.x + hw, rect.y, hw, hh));
					divide(new Rect(rect.x, rect.y + hh, hw, hh));
					divide(new Rect(rect.x + hw, rect.y + hh, hw, hh));
				} else {
					rect.draw();
				}
			} else {
				rect.draw();
			}
		}
		divide(rect);
		attribute(canvas.program, "aPosition", vertices, 3, 36, 0);
		attribute(canvas.program, "aNormal", null, 3, 36, 12);
		attribute(canvas.program, "aColor", null, 3, 36, 24);
		return iV / 9;
	}
	const pointer = {
		init(canvas) {
			this.x = canvas.width * 0.5;
			this.y = canvas.height * 0.5;
			this.ex = this.x;
			this.ey = this.y * 2;
			["mousemove", "touchstart", "touchmove"].forEach((event, touch) => {
				canvas.elem.addEventListener(
					event,
					e => {
						if (touch) {
							e.preventDefault();
							this.x = e.targetTouches[0].clientX;
							this.y = e.targetTouches[0].clientY;
						} else {
							this.x = e.clientX;
							this.y = e.clientY;
						}
					},
					false
				);
			});
		},
		ease(step) {
			this.ex += (this.x - this.ex) * step;
			this.ey += (this.y - this.ey) * step;
		}
	};
	pointer.init(canvas);
	////////////////////////////////////////////////////////////////
	const run = () => {
		requestAnimationFrame(run);
		pointer.ease(0.02);
		const rx = (pointer.ex - canvas.width * 0.5) / (canvas.width * 0.35);
		const ry = (-pointer.ey + canvas.height * 0.5) / (canvas.height * 0.35);
		camera.view
			.identity()
			.translate(0, ry * 4, -50 + Math.sqrt(rx * rx + ry * ry) * 30)
			.rotateX(Math.PI/2)
			.rotateZ(rx)
			.rotateX(ry)
			.load();
		gl.drawArrays(gl.TRIANGLES, 0, numElements);
	};
	let numElements = 0;
	const start = () => {
		numElements = decode();
		run();
	};
	requestAnimationFrame(start);
}










































































$(document).ready(function() {

  var myPlaylist = new jPlayerPlaylist({
    jPlayer: "#jquery_jplayer_1",
    cssSelectorAncestor: "#jp_container_1"
  }, [{
    title: "December",
    artist: "IDK",
    mp3: "./musik/December.mp3",
   
  }, {
    title: "Faces",
    artist: "Swavay",
    mp3: "./musik/FACES.mp3",
    
  }, {
    title: "Footsteps in the Dark Pts. 1 & 2",
    artist: "SIR",
    mp3: "./musik/Footsteps in the Dark Pts. 1 & 2.mp3",
    
  }, {
    title: "F vs J Intro",
    artist: "Fabolous and Jadakiss",
    mp3: "./musik/F vs J Intro.mp3",
    
  }, {
    title: "On Sight",
    artist: "Free Nationals",
    mp3: "./musik/On Sight.mp3",
    
  }, {
    title: "Model Walk",
    artist: "Lowkey V",
    mp3: "./musik/Model Walk.mp3",
    
  }, {
    title: "I Can't Make It Home",
    artist: "Devin The Dude ft. L. C.",
    mp3: "./musik/I Can't Make It Home.mp3",
    
  }, {
    title: "A.D.H.D.",
    artist: "Kendrick Lamar",
    mp3: "./musik/ADHD.mp3",
    
  }, {
    title: "Come Down",
    artist: "Anderson Paak",
    mp3: "./musik/Come-Down.mp3",
    
  }, {
    title: "Collide",
    artist: "Tiana Major9 & Earthgang",
    mp3: "./musik/Collide.mp3",
   
  }, {
    title: "All They Wanna Do",
    artist: "Iman Omari",
    mp3: "./musik/All They Wanna Do.mp3",
    
  }, {
    title: "Special Affair",
    artist: "The Internet",
    mp3: "/musik/Special Affair.mp3",
    
  }, {
    title: "Its Time For Da Perculator",
    artist: "Cajmere",
    mp3: "./musik/ITS TIME FOR DA PERCULATOR.mp3",
  
  }], {
    swfPath: "../../dist/jplayer",
    supplied: "oga, mp3",
    wmode: "window",
    useStateClassSkin: true,
    autoBlur: false,
    smoothPlayBar: true,
    keyEnabled: true
  }); // end jplayer initiate

  /* ======== Other Audio Player Functions ======== */

  $("#jquery_jplayer_1").on(
    $.jPlayer.event.ready + ' ' + $.jPlayer.event.play,
    function(event) {

      /* === ENABLE PLAYLIST ==== */

      var current = myPlaylist.current;
      var playlist = myPlaylist.playlist;
      $.each(playlist, function(index, obj) {
        if (index == current) {
          $(".jp-now-playing").html("<div class='jp-track-name'>" + obj.title + "</div> <div class='jp-artist-name'>" + obj.artist + "</div>");

        }
      });

      /* === VOLUME DRAGGING ==== */

      $('.jp-volume-bar').mousedown(function() {
          var parentOffset = $(this).offset(),
            width = $(this).width();
          $(window).mousemove(function(e) {
            var x = e.pageX - parentOffset.left,
              volume = x / width
            if (volume > 1) {
              $("#jquery_jplayer_1").jPlayer("volume", 1);
            } else if (volume <= 0) {
              $("#jquery_jplayer_1").jPlayer("mute");
            } else {
              $("#jquery_jplayer_1").jPlayer("volume", volume);
              $("#jquery_jplayer_1").jPlayer("unmute");
            }
          });
          return false;
        })
        .mouseup(function() {
          $(window).unbind("mousemove");
        });

      /* === ENABLE DRAGGING ==== */

      var timeDrag = false; /* Drag status */
      $('.jp-play-bar').mousedown(function(e) {
        timeDrag = true;
        updatebar(e.pageX);
      });
      $(document).mouseup(function(e) {
        if (timeDrag) {
          timeDrag = false;
          updatebar(e.pageX);
        }
      });
      $(document).mousemove(function(e) {
        if (timeDrag) {
          updatebar(e.pageX);
        }
      });

      //update Progress Bar control
      var updatebar = function(x) {

        var progress = $('.jp-progress');
        //var maxduration = myPlaylist.duration; //audio duration

        var position = x - progress.offset().left; //Click pos
        var percentage = 100 * position / progress.width();

        //Check within range
        if (percentage > 100) {
          percentage = 100;
        }
        if (percentage < 0) {
          percentage = 0;
        }

        $("#jquery_jplayer_1").jPlayer("playHead", percentage);

        //Update progress bar
        $('.jp-play-bar').css('width', percentage + '%');
      };

      /* === Playlist Functions ==== */

      $('#playlist-toggle').on('click', function() {
        $('#playlist-wrap').stop().fadeToggle();
        $(this).toggleClass('playlist-is-visible');
      });

    }); // end jplayer event ready

}); // end document ready