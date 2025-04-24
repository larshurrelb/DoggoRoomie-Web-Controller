import { CONFIG } from './config.js';

class FaceTriggerController {
    constructor() {
        this.keyDisplay = null;
        this.triggerStatus = null;  
        this.ws = null;
        this.serverUrl = CONFIG.WS_SERVER;
        this.isConnected = false;
        this.triggers = new Map();
        this.audioElement = null;  
        this.updateConnectionStatus = this.updateConnectionStatus.bind(this);
    }

    initialize() {
        this.keyDisplay = document.getElementById('keyPressed');
        this.triggerStatus = document.getElementById('triggerStatus');  
        this.audioElement = document.getElementById('audio1');  
        this.initializeWebSocket();
        this.initializeKeyboardControls();
        this.startConnectionStatusPolling();
        console.log('FaceTriggerController initialized');
    }

    initializeWebSocket() {
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to Deno animation server');
            this.isConnected = true;
        };

        // message handler
        this.ws.onmessage = (event) => {
            const key = event.data;

            const triggerMap = {
                '1': 'Idle',
                '2': 'PuppyEyes',
                '3': 'Staring',
                '4': 'Happy',
                '5': 'Panting',
                '6': 'Sighing',
                '7': 'Barking',
                '8': 'Woofing',
                '9': 'Bumping', 
                'ß': 'Gaze to the right', 
                '0': 'Gaze to the left',
                'i': 'StopAllSounds'
            };
            
            const triggerName = triggerMap[key];
            if (triggerName) {
                this.updateTriggerStatus(triggerName);
                const trigger = this.triggers.get(triggerName);
                if (trigger) {
                    trigger.fire();
                }
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnected = false;
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.initializeWebSocket(), 5000); 
        };
    }

    // method for updating trigger status
    updateTriggerStatus(triggerName) {
        if (this.triggerStatus) {
            this.triggerStatus.textContent = `Current Trigger: ${triggerName}`;
            console.log(`Updated trigger status to: ${triggerName}`);
        }
    }

    // method to store Rive triggers
    setTrigger(name, trigger) {
        this.triggers.set(name, trigger);
        console.log(`Registered trigger: ${name}`);
    }

    // Modify triggerAnimation to handle both WebSocket and local triggers
    triggerAnimation(key) {

        const triggerMap = {
            '1': 'Idle',
            '2': 'PuppyEyes',
            '3': 'Staring',
            '4': 'Happy',
            '5': 'Panting',
            '6': 'Sighing',
            '7': 'Barking',
            '8': 'Woofing',
            '9': 'Bumping', 
            'ß': 'Gaze to the right', 
            '0': 'Gaze to the left',
            'i': 'StopAllSounds' 
        };

        // Send to WebSocket
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(key);
            console.log(`Sent to WebSocket: ${key}`);
        }

        // Trigger local animation
        const triggerName = triggerMap[key];
        this.updateTriggerStatus(triggerName); 
        const trigger = this.triggers.get(triggerName);
        if (trigger) {
            trigger.fire();
            console.log(`Fired local trigger: ${triggerName}`);
            return true;
        }

        console.log(`Trigger not found: ${triggerName}`);
        return false;
    }

    initializeKeyboardControls() {

        const triggerMap = {
            '1': 'Idle',
            '2': 'PuppyEyes',
            '3': 'Staring',
            '4': 'Happy',
            '5': 'Panting',
            '6': 'Sighing',
            '7': 'Barking',
            '8': 'Woofing',
            '9': 'Bumping', 
            'ß': 'Gaze to the right', 
            '0': 'Gaze to the left',
            'i': 'StopAllSounds'
        };

        document.addEventListener('keydown', (event) => {
            const key = event.key;
            if (key >= '1' && key <= '9' || key === 'i' || key === '0' || key === 'ß') {
                const triggerName = triggerMap[key];
                console.log(`Key ${key} pressed, triggering: ${triggerName}`);
                
                // Send animation trigger via WebSocket
                this.triggerAnimation(key);
                
                // Update UI
                this.keyDisplay.textContent = `Key: ${key} (${triggerName})`;
                this.keyDisplay.classList.add('active');
            } else if (key === 'p') { // previously the key here was 'i' 
                this.playSound();
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key >= '1' && event.key <= '9' || event.key === 'i' || event.key === '0' || event.key === 'ß') {
                this.keyDisplay.textContent = 'No key pressed';
                this.keyDisplay.classList.remove('active');
            }
        });
    }

    playSound() {
        if (this.audioElement) {
            this.audioElement.play();
            console.log('Playing sound: 1.wav');
        }
    }

    async pingHost(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);
            
            const response = await fetch(url, {
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return true;
        } catch (error) {
            return false;
        }
    }

    async updateConnectionStatus() {
        // Update WebSocket status
        const wsStatus = document.getElementById('websocket-status');
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            wsStatus.classList.add('connected');
            wsStatus.classList.remove('disconnected');
        } else {
            wsStatus.classList.add('disconnected');
            wsStatus.classList.remove('connected');
        }

        // Simple ping check for Valetudo
        const valetudoReachable = await this.pingHost(`http://${CONFIG.VALETUDO_HOST}`);
        document.getElementById('valetudo-status').classList.toggle('connected', valetudoReachable);
        document.getElementById('valetudo-status').classList.toggle('disconnected', !valetudoReachable);

        // Simple ping check for Arduino
        const arduinoReachable = await this.pingHost(`http://${CONFIG.ARDUINO_HOST}`);
        document.getElementById('arduino-status').classList.toggle('connected', arduinoReachable);
        document.getElementById('arduino-status').classList.toggle('disconnected', !arduinoReachable);
    }

    startConnectionStatusPolling() {
        // Update status immediately and then every 5 seconds
        this.updateConnectionStatus();
        setInterval(this.updateConnectionStatus, 5000);
    }
}

// Create and export controller instance
window.FaceTriggerController = new FaceTriggerController();