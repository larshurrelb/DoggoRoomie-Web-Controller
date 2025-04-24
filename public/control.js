let isControlActive = false;
const keyDisplay = document.getElementById('keyPressed');

const moveCommands = {
    'w': 'FORWARD',
    'arrowup': 'FORWARD',
    's': 'BACKWARD',
    'arrowdown': 'BACKWARD', 
    'a': 'ROTATE_COUNTERCLOCKWISE',
    'arrowleft': 'ROTATE_COUNTERCLOCKWISE',
    'd': 'ROTATE_CLOCKWISE',
    'arrowright': 'ROTATE_CLOCKWISE',
    't': 'SERVO_SPEED1',
    'z': 'SERVO_SPEED2',
    'u': 'SERVO_SPEED3'
};

let servoStates = {
    't': false,
    'z': false,
    'u': false
};

// Add handler for movement stop
document.addEventListener('keyup', async (event) => {
    const key = event.key.toLowerCase();
    keyDisplay.textContent = 'No key pressed';
    keyDisplay.classList.remove('active');
    
    // Only send stop command if it was a movement key
    if (isControlActive && moveCommands[key]) {
        await sendCommand('STOP');
    }
});

async function sendCommand(command) {
    try {
        const response = await fetch('/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        });
        if (!response.ok) throw new Error('Network response was not ok');
        console.log(`Command ${command} sent successfully`);
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener('keydown', async (event) => {
    const key = event.key.toLowerCase();
    keyDisplay.textContent = `Key pressed: ${key}`;
    keyDisplay.classList.add('active');
    
    if (key === ' ') {
        isControlActive = !isControlActive;
        const statusElement = document.getElementById('status');
        statusElement.textContent = `Status: ${isControlActive ? 'Active' : 'Ready'}`;
        statusElement.className = isControlActive ? 'active' : 'inactive';
        await sendCommand(isControlActive ? 'ENABLE' : 'DISABLE');
        return;
    }

    if (['t', 'z', 'u'].includes(key)) {
        servoStates[key] = !servoStates[key];
        await sendCommand(servoStates[key] ? moveCommands[key] : 'SERVO_STOP');
        return;
    }

    if (isControlActive && moveCommands[key]) {
        await sendCommand(moveCommands[key]);
    }
});

document.addEventListener('keyup', () => {
    keyDisplay.textContent = 'No key pressed';
    keyDisplay.classList.remove('active');
});