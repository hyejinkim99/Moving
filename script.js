// queue-list를 관리하는...
class ActionQueue {
    constructor(queueClassName) {
        this.queueList = [];
        this.queueElement = document.getElementById(queueClassName);
    }

    push(action) {
        this.queueList.push(action)
        let actionText = '';
        switch (action) {
            case 'forward':
                actionText = '▲';
                break;
            case 'left':
                actionText = '◀';
                break;
            case 'right':
                actionText = '▶';
                break;
            case 'function':
                actionText = '■';
                break;
            default:
                break;
        }
        const newItem = document.createElement('li');
        newItem.textContent = actionText;
        this.queueElement.appendChild(newItem);
    }

    pop() {
        if (this.queueList.length > 0) {
            this.queueList.pop();
        }
        if (this.queueElement.lastChild) {
            this.queueElement.removeChild(this.queueElement.lastChild);
        }
    }

    getActionQueue() {
        return this.queueElement;
    }

    clear() {
        this.queueList = [];
        while (this.queueElement.lastChild) {
            this.queueElement.removeChild(this.queueElement.lastChild);
        }
    }
}

class VehicleStatus {
    constructor() {
        this.row = 0;
        this.col = 0;
        this.heading = 0;
        this.objectCarrying = false;
        this.objectNumber = 0;
        this.objectColor = 'transparent';
    }

    getStatus() {
        return {
            position : {
                row : this.row,
                col : this.col
            },
            heading : this.heading,
            object : {
                carrying : this.objectCarrying,
                number : this.objectNumber,
                color : this.objectColor
            },
            nextPosition : this.getNextMoveForwardPosition()
        }
    }

    isCarrying() {
        return this.objectNumber;
    }

    getHeading() {
        return ((this.heading % 360) + 360) % 360
    }

    getNextMoveForwardPosition() {
        const heading = this.getHeading()
        if (heading === 0) {            // eastward
            return {
                row : this.row + 1,
                col : this.col
            };
        } else if (heading === 90) {    // northward
            return {
                row : this.row,
                col : this.col + 1
            };
        } else if (heading === 180) {   // westward
            return {
                row : this.row - 1,
                col : this.col
            };
        } else if (heading === 270) {   // southward
            return {
                row : this.row,
                col : this.col - 1
            };
        } else {
            return {
                row : -1,
                col : -1
            };
        }
    }

    moveForward() {
        const heading = this.getHeading()
        if (heading === 0) {
            this.row += 1;
        } else if (heading === 90) {
            this.col += 1;
        } else if (heading === 180) {
            this.row -= 1;
        } else if (heading === 270) {
            this.col -= 1;
        }
    }

    rotateLeft() {
        this.heading -= 90;
    }

    rotateRight() {
        this.heading += 90;
    }

    rotate(direction) {
        if (direction == 'left') {
            this.rotateLeft();
        } else if (direction == 'right') {
            this.rotateRight();
        }
    }

    grab(objectStatus) {
        this.objectCarrying = true;
        this.objectNumber = objectStatus.number;
        this.objectColor = objectStatus.color;
    }

    release() {
        this.objectCarrying = false;
        this.objectNumber = 0;
        this.objectColor = 'transparent';
    }
}

class MapStatus {
    constructor(info) {
        this.size = {
            row : info.size[0],
            col : info.size[1]
        };
        this.obstacles = [];
        const obsacles = info.obstacles;
        for (let i=0; i<obsacles.length; i++) {
            const obstacle = obsacles[i];
            this.obstacles.push({
                row : obstacle[0],
                col : obstacle[1]
            })
        }
        this.objects = [];
        const colors = ['red', 'blue', 'green'];
        const objects = info.objects;
        for (let i=0; i<objects.length; i++) {
            const object = objects[i];
            this.objects.push({
                number : i+1,
                color : colors[i],
                carried : false,
                completed : false,
                start : {
                    row : object[0][0],
                    col : object[0][1]
                },
                end : {
                    row : object[1][0],
                    col : object[1][1]
                }
            })
        }
    }

    getStatus() {
        return {
            size : {
                row : this.size.row,
                col : this.size.col
            },
            obstacles : this.obstacles,
            objects : this.objects
        }
    }

    hasAnObstacle(r, c) {
        for (let i=0; i<this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            if (obstacle.row === r && obstacle.col === c) {
                return true;
            }
        }
        return false;
    }

    hasAnObject(r, c) {
        let objectNumber = 0;
        for (let i=0; i<this.objects.length; i++) {
            const object = this.objects[i];
            if (!object.completed && !object.carried && object.start.row === r && object.start.col === c) {
                objectNumber = object.number;
            }
        }
        return objectNumber;
    }

    hasAnEndPointOfObject(r, c) {
        let objectNumber = 0;
        for (let i=0; i<this.objects.length; i++) {
            const object = this.objects[i];
            if (!object.completed && object.carried && object.end.row === r && object.end.col === c) {
                objectNumber = object.number;
            }
        }
        return objectNumber;
    }

    getObjectAt(r, c) {
        for (let i=0; i<this.objects.length; i++) {
            const object = this.objects[i];
            if (object.start.row === r && object.start.col === c) {
                return {
                    number : object.number,
                    color : object.color
                }
            }
        }
        return {
            number : 0,
            color : 'transparent'
        }
    }

    isPossibleAt(r, c) {
        if (0 <= r && r < this.size.row && 0 <= c && c < this.size.col) {
            return true;
        } else {
            return false;
        }
    }

    objectPicked(objectNumber) {
        for (let i=0; i<this.objects.length; i++) {
            const object = this.objects[i];
            if (object.number === objectNumber) {
                object.carried = true;
                return true;
            }
        }
        return false;
    }

    objectReleased(objectNumber, r, c) {
        for (let i=0; i<this.objects.length; i++) {
            const object = this.objects[i];
            if (object.number === objectNumber && object.end.row === r && object.end.col === c) {
                object.carried = false;
                object.completed = true;
                this.obstacles.push({
                    row : object.end.row,
                    col : object.end.col
                })
                return true;
            }
        }
        return false;
    }

    isCompleted() {
        for (let i=0; i<this.objects.length; i++) {
            const object = this.objects[i];
            if (!object.completed) {
                return false;
            }
        }
        return true;
    }
}

class VehicleView {
    constructor(gridSize, width, height) {
        this.width = width
        this.height = height
        this.gridSize = gridSize;
        this.left = 0;
        this.top = 320;
        this.vehicle = document.getElementById('vehicle');
        this.object = document.getElementById('objectCarried');
        this.vehicle.style.transform = `translate(${-this.width/2}px, ${-this.height/2} rotate 0deg)`;
    }

    update(vehicleStatus) {
        const position = vehicleStatus.position;
        const heading = vehicleStatus.heading;
        const translateX = position.col * this.gridSize; // Calculate X offset
        const translateY = -position.row * this.gridSize;    // Calculate Y offset
        this.vehicle.style.transform = `translate(${translateX - this.width/2}px, ${translateY - this.height/2}px) rotate(${heading}deg)`;
        if (vehicleStatus.object.carrying) {
            this.drawObject(vehicleStatus.object.color);
        } else {
            this.eraseObject();
        }
    }

    drawObject(color) {
        this.object.style.backgroundColor = `${color}`;
        this.object.style.border = `2px solid ${color}`;
    }

    eraseObject() {
        this.object.style.backgroundColor = `transparent`;
        this.object.style.border = `2px solid transparent`;
    }
}

class MapView {

    constructor() {
        this.gridSize = 80;
        this.left = 0;
        this.top = 320;
        this.obSize = 20;
    }

    createElement(className, r, c) {
        const obs = document.createElement('div');
        obs.className = className
        obs.style.left = `${this.left + this.gridSize * c - this.obSize/2}px`;
        obs.style.top = `${this.top - this.gridSize * r - this.obSize/2}px`;
        return obs;
    }

    drawObstacle(gridBox, r, c) {
        const obs = this.createElement('obstacle', r, c);
        gridBox.appendChild(obs);
    }

    drawObject(gridBox, r, c, color, filled) {
        const obj = this.createElement('object', r, c);
        obj.style.borderColor = `${color}`;
        if (filled) {
            obj.style.backgroundColor = color;
            obj.classList.add('filled');
        } else {
            obj.style.backgroundColor = 'transparent';
            obj.classList.add('empty');
        }
        gridBox.appendChild(obj);
    }

    draw(mapStatus) {
        const gridBox = document.getElementsByClassName('animation-container')[0];
        const obstaclesToDelete = gridBox.getElementsByClassName('obstacle');
        const objectsToDelete = gridBox.getElementsByClassName('object');
        Array.from(obstaclesToDelete).forEach(element => element.remove());
        Array.from(objectsToDelete).forEach(element => element.remove());
        // draw obstacles
        const obstacles = mapStatus.obstacles;
        for (let i=0; i<obstacles.length; i++) {
            const obstacle = obstacles[i];
            this.drawObstacle(gridBox, obstacle.row, obstacle.col);
        }
        // draw objects
        const objects = mapStatus.objects;
        for (let i=0; i<objects.length; i++) {
            const object = objects[i];
            if (!object.completed) {
                this.drawObject(gridBox, object.end.row, object.end.col, object.color, false);
            }
            if (!object.carried && !object.completed) {
                this.drawObject(gridBox, object.start.row, object.start.col, object.color, true);
            }
        }
    }
    
}


async function fetchAndProcessJson(dataFile) {
    try {
        const response = await fetch(`data/${dataFile}.json`);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        main(data);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

let vehicle;
let vehicleView;
let map;
let mapView;
let actions;

// Get the modal element
const modal = document.getElementById('levelSelectionModal');

function openModal() {
    modal.style.display = 'block';
    vehicle = new VehicleStatus();
    vehicleView.update(vehicle.getStatus());
    actions.clear();
}

function closeModal() {
    modal.style.display = 'none';
    vehicle = new VehicleStatus();
    vehicleView.update(vehicle.getStatus());
    actions.clear();
}

function isModelOpened() {
    if (modal.style.display == 'block') {
        return true;
    } else {
        return false;
    }
}

// Show the modal when the page loads
window.onload = function() {
    openModal();
};

// Get the close button element
const closeButton = document.querySelector('.close-button');

// Close the modal when the close button is clicked
closeButton.onclick = function() {
    closeModal();
};

// Close the modal when the user clicks outside the modal content
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
};

// Get the start game button
const startGameButton = document.getElementById('startGameButton');

// Add event listener to the start game button
startGameButton.addEventListener('click', () => {
    const selectedLevel = document.getElementById('levelSelector').value;
    fetchAndProcessJson(selectedLevel); // Fetch and process the selected level
    closeModal();
});


function main(data) {
    const index = Math.floor(Math.random() * (data.length));
    console.log(index);
    const mapInfo = data[index];

    vehicle = new VehicleStatus();
    vehicleView = new VehicleView(80, 40, 60);

    map = new MapStatus(mapInfo);
    mapView = new MapView();
    mapView.draw(map.getStatus());

    actions = new ActionQueue('queue-list');
}

// Function to handle move events
function handleMove(action) {
        
    if (action == 'forward') {
        let vehicleStatus = vehicle.getStatus();
        const vehicleCurrentPosition = vehicleStatus.position;
        const currentRow = vehicleCurrentPosition.row;
        const currentCol = vehicleCurrentPosition.col;

        const vehicleNextPosition = vehicleStatus.nextPosition;
        const nextRow = vehicleNextPosition.row;
        const nextCol = vehicleNextPosition.col;

        if (!map.isPossibleAt(nextRow, nextCol)) {
            alert('out of map');
            return 0;
        } else if (map.hasAnObstacle(nextRow, nextCol)) {
            alert('there is an obstacle');
            return 0;
        } else if (map.hasAnObject(nextRow, nextCol) && vehicleStatus.object.carrying) {
            alert('you cannot go to pick up object with carrying object');
            return 0;
        } else if (map.hasAnObject(currentRow, currentCol) && !vehicleStatus.object.carrying) {
            alert('you have to pick up object first');
            return 0;
        } else {
            vehicle.moveForward();
            let vehicleStatus = vehicle.getStatus();
            vehicleView.update(vehicleStatus);
            actions.push(action);
            return 0;
        }
    } else if (action == 'left' || action == 'right') {
        let vehicleStatus = vehicle.getStatus();
        const vehicleCurrentPosition = vehicleStatus.position;
        const currentRow = vehicleCurrentPosition.row;
        const currentCol = vehicleCurrentPosition.col;

        if (map.hasAnObject(currentRow, currentCol) && !vehicleStatus.object.carrying) {
            alert('you have to pick up object first');
            return 0;
        } else {
            vehicle.rotate(action);
            let vehicleStatus = vehicle.getStatus();
            vehicleView.update(vehicleStatus);
            actions.push(action);
        }
    } else if (action == 'function') {
        let vehicleStatus = vehicle.getStatus();
        const vehicleCurrentPosition = vehicleStatus.position;
        const currentRow = vehicleCurrentPosition.row;
        const currentCol = vehicleCurrentPosition.col;

        const objectNumber = map.hasAnObject(currentRow, currentCol)
        if (objectNumber != 0 && !vehicleStatus.object.carrying) {
            if (map.objectPicked(objectNumber)) {
                const objectStatus = map.getObjectAt(currentRow, currentCol);
                vehicle.grab(objectStatus);
                let vehicleStatus = vehicle.getStatus();
                let mapStatus = map.getStatus();
                vehicleView.update(vehicleStatus);
                mapView.draw(mapStatus);
                actions.push(action);
                return 0;
            }
        }
        const objectEndPoint = map.hasAnEndPointOfObject(currentRow, currentCol);
        if (objectEndPoint == 0) {
            if (vehicleStatus.object.carrying) {
                alert('put it in right place');
            } else {
                alert('nothing to grab');
            }
        } else if (map.objectReleased(vehicleStatus.object.number, currentRow, currentCol)) {
            vehicle.release();
            let vehicleStatus = vehicle.getStatus();
            let mapStatus = map.getStatus();
            vehicleView.update(vehicleStatus);
            mapView.draw(mapStatus);
            actions.push(action);
            return 0;
        }

    } else if (action == 'delete') {
        actions.pop()
    } else if (action == 'finish') {
        let vehicleStatus = vehicle.getStatus();
        const vehicleCurrentPosition = vehicleStatus.position;
        const currentRow = vehicleCurrentPosition.row;
        const currentCol = vehicleCurrentPosition.col;
        if (currentRow === 0 && currentCol === 0 && map.isCompleted()) {
            alert('CLEAR!');
            openModal();
        }
    }
}

//fetchAndProcessJson();


// Function to handle button clicks
function handleButtonClick(event) {
    const buttonId = event.target.id;

    switch (buttonId) {
        case 'up-btn':
            handleMove('forward');
            break;
        case 'left-btn':
            handleMove('left');
            break;
        case 'right-btn':
            handleMove('right');
            break;
        case 'func-btn':
            handleMove('function');
            break;
        case 'delete-btn':
            handleMove('delete');
            break;
        default:
            console.warn('Unknown button clicked:', buttonId);
            break;
    }
}

// Function to handle key press
function handleKeyPressed(event) {
    const eventKey = event.key;

    if (isModelOpened()) {
        return 0;
    }

    switch (eventKey) {
        case 'ArrowUp':
            handleMove('forward');
            break;
        case 'ArrowLeft':
            handleMove('left');
            break;
        case 'ArrowRight':
            handleMove('right');
            break;
        case ' ':
        case 'Spacebar':
        case 'Space':
            handleMove('function');
            event.preventDefault();
            break;
        case 'Backspace':
            handleMove('delete');
            break;
        case 'Enter':
            handleMove('finish');
            break;
        default:
            break;
    }
}


// Event listener for buttonclick
const buttonIds = ['up-btn', 'left-btn', 'right-btn', 'func-btn', 'delete-btn'];
buttonIds.forEach(function(id) {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener('click', handleButtonClick);
    } else {
        console.error('Button not found:', id);
    }
});

// Event listener for keypresses
document.addEventListener('keydown', handleKeyPressed);

// window.addEventListener('resize', () => {
//     let width = window.innerWidth;
//     let height = window.innerHeight;

//     console.log(`Screen size changed. New width: ${width}, New height: ${height}`);
// });
