
document.addEventListener("DOMContentLoaded", function () {
          // Entry animation for all .cube elements (scaling from 0)
          gsap.from(".cube", {
              scale: 0,
              duration: 2,
              ease: 'power3.inOut',
          });

          // Animating the .hey cubes
          gsap.to(".z .cube.hey", {
              z: 75,
              duration: 1,
              ease: 'power3.inOut',
              repeat: -1,
              yoyo: true,
              stagger: {
                  each: 0.01,
                  from: 'start',
                  delay: 0,
              }
          });

          let isDragging = false;
          let lastX = 0;
          let lastY = 0;
          let rotationX = -24;
          let rotationY = -23;
          let rotation = 170;
          const dragFactor = 0.5;

          const floor = document.querySelector('.floor');
          const scene = document.querySelector('.scene');

          gsap.set(floor, {
              x: 0,
              y: 0,
              z: 0,
              rotationX: rotationX,
              rotationY: rotationY,
              rotation: rotation,
              transformOrigin: "center center"
          });

          let autoRotate;

          function startAutoRotate() {
              autoRotate = gsap.to(floor, {
                  rotationY: `+=360`,
                  rotationX: `+=20`,
                  duration: 30,
                  ease: "linear",
                  repeat: -1
              });
          }

          startAutoRotate();

          // Mouse and touch drag functionality
          function startDrag(x, y) {
              isDragging = true;
              lastX = x;
              lastY = y;
              if (autoRotate) autoRotate.kill();
          }

          function moveDrag(x, y) {
              if (!isDragging) return;
              const deltaX = x - lastX;
              const deltaY = y - lastY;

              rotationY -= deltaX * dragFactor;
              rotationX += deltaY * dragFactor;

              gsap.set(floor, { rotationX: rotationX, rotationY: rotationY });

              lastX = x;
              lastY = y;
          }

          function stopDrag() {
              if (!isDragging) return;
              isDragging = false;
              startAutoRotate();
          }

          // Mouse events
          floor.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
          document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
          document.addEventListener('mouseup', stopDrag);

          // Touch events
          floor.addEventListener('touchstart', (e) => {
              if (e.touches.length === 1) {
                  startDrag(e.touches[0].clientX, e.touches[0].clientY);
              } else if (e.touches.length === 2) {
                  pinchStartDistance = getDistance(e.touches);
                  pinchStartScale = scale;
              }
          });

          floor.addEventListener('touchmove', (e) => {
              if (e.touches.length === 1) {
                  moveDrag(e.touches[0].clientX, e.touches[0].clientY);
              } else if (e.touches.length === 2) {
                  let newDistance = getDistance(e.touches);
                  let scaleChange = newDistance / pinchStartDistance;
                  scale = pinchStartScale * scaleChange;
                  scale = Math.min(Math.max(scale, 0.5), 2);
                  gsap.to(scene, { scale: scale, duration: 0.1, ease: 'power3.inOut' });
              }
          });

          floor.addEventListener('touchend', (e) => {
              if (e.touches.length === 0) stopDrag();
          });

          // Helper function to calculate distance between two touch points
          function getDistance(touches) {
              let dx = touches[0].clientX - touches[1].clientX;
              let dy = touches[0].clientY - touches[1].clientY;
              return Math.sqrt(dx * dx + dy * dy);
          }

          // Zoom in and out on mouse wheel
          let scale = 1;
          let zoomSpeed = 0.002;
          let pinchStartDistance = 0;
          let pinchStartScale = 1;

          scene.addEventListener('wheel', (e) => {
              let zoomChange = -e.deltaY * zoomSpeed;
              scale += zoomChange;
              scale = Math.min(Math.max(scale, 0.5), 2);
              gsap.to(scene, { scale: scale, duration: 0.1, ease: 'power3.inOut' });
              e.preventDefault();
          });
      });

