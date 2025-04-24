 // Canvas setup
 const canvas = document.getElementById('canvas');
        
 // Set initial canvas size
 const resizeCanvas = () => {
     canvas.width = 500;
     canvas.height = 500;
 };
 resizeCanvas();

 // Store the stateMachine inputs globally
 let inspirationTrigger;

 // Replace the existing Rive initialization with this:
 const r = new rive.Rive({
     src: 'dog_animations.riv',
     canvas: canvas,
     autoplay: true,
     stateMachines: "State Machine",
     onLoad: () => {
         try {
             const inputs = r.stateMachineInputs('State Machine');
             const triggerNames = [
                 'Idle',
                 'PuppyEyes',
                 'Staring',
                 'Happy',
                 'Panting',
                 'Sighing',
                 'Barking',
                 'Woofing',
                 'Bumping', 
                 'Gaze to the right',
                 'Gaze to the left',
             ];

             // Get status element once
             const triggerStatusElement = document.getElementById('triggerStatus');

             triggerNames.forEach(name => {
                 const trigger = inputs.find(i => i.name === name);
                 if (trigger && window.FaceTriggerController) {
                     window.FaceTriggerController.setTrigger(name, trigger);
                     
                     // Enhanced trigger change listener
                     trigger.onValueChange = (event) => {
                         console.log(`Trigger ${name} value changed to:`, event.value); // Debug log
                         if (event.value) {
                             if (triggerStatusElement) {
                                 triggerStatusElement.textContent = `Current Trigger: ${name}`;
                             } else {
                                 console.error('Trigger status element not found');
                             }
                         }
                     };
                 } else {
                     console.warn(`Trigger ${name} not found or FaceTriggerController not initialized`);
                 }
             });

             // Add a state machine listener to track state changes
             r.on('stateChanged', (event) => {
                 console.log('State changed:', event);
             });

             r.resizeDrawingSurfaceToCanvas();
             console.log('Rive animation loaded successfully');
         } catch (error) {
             console.error('Error initializing Rive:', error);
         }
     },
     onError: (err) => {
         console.error('Error loading Rive animation:', err);
         document.getElementById('keyPressed').textContent = 'Animation failed to load';
     }
 });

 // Handle window resize
 window.addEventListener('resize', () => {
     r.resizeDrawingSurfaceToCanvas();
 });

 // Cleanup on page unload
 window.addEventListener('unload', () => {
     r.cleanup();
 });