class ActionQueue {
    constructor(queueClassName) {
        this.queueList = [];
        this.queueElement = document.getElementById(queueClassName);
    }

    push(action) {
        this.queueList.push(action);
        const actionText = this.getActionText(action);
        const newItem = document.createElement('li');
        newItem.textContent = actionText;
        this.queueElement.appendChild(newItem);
    }

    pop() {
        if (this.queueList.length > 0) {
            this.queueList.pop();
            if (this.queueElement.lastChild) {
                this.queueElement.removeChild(this.queueElement.lastChild);
            }
        }
    }

    clear() {
        this.queueList = [];
        while (this.queueElement.lastChild) {
            this.queueElement.removeChild(this.queueElement.lastChild);
        }
    }

    getActionText(action) {
        const actionMap = {
            'forward': '⬆️',
            'left': '⬅️',
            'right': '➡️',
            'function': '⏹'
        };
        return actionMap[action] || '';
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
            position: {
                row: this.row,
                col: this.col
            },
            heading: this.heading,
            object: {
                carrying: this.objectCarrying,
                number: this.objectNumber,
                color: this.objectColor
            },
            nextPosition: this.getNextMoveForwardPosition()
        };
    }

    isCarrying() {
        return this.objectNumber !== 0;
    }

    getHeading() {
        return ((this.heading % 360) + 360) % 360;
    }

    getNextMoveForwardPosition() {
        const heading = this.getHeading();
        const directionMap = {
            0: { row: this.row + 1, col: this.col },
            90: { row: this.row, col: this.col + 1 },
            180: { row: this.row - 1, col: this.col },
            270: { row: this.row, col: this.col - 1 }
        };
        return directionMap[heading] || { row: -1, col: -1 };
    }

    moveForward() {
        const heading = this.getHeading();
        switch (heading) {
            case 0:
                this.row += 1;
                break;
            case 90:
                this.col += 1;
                break;
            case 180:
                this.row -= 1;
                break;
            case 270:
                this.col -= 1;
                break;
        }
    }

    rotate(direction) {
        if (direction === 'left') {
            this.heading -= 90;
        } else if (direction === 'right') {
            this.heading += 90;
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
            row: info.size[0],
            col: info.size[1]
        };
        this.obstacles = info.obstacles.map(obstacle => ({ row: obstacle[0], col: obstacle[1] }));
        const colors = ['blue', 'green', 'red'];
        this.objects = info.objects.map((object, index) => ({
            number: index + 1,
            color: colors[index % colors.length],
            carried: false,
            completed: false,
            start: {
                row: object[0][0],
                col: object[0][1]
            },
            end: {
                row: object[1][0],
                col: object[1][1]
            }
        }));
    }

    getStatus() {
        return {
            size: { ...this.size },
            obstacles: [...this.obstacles],
            objects: [...this.objects]
        };
    }

    hasAnObstacle(r, c) {
        return this.obstacles.some(obstacle => obstacle.row === r && obstacle.col === c);
    }

    hasAnObject(r, c) {
        const object = this.objects.find(obj => !obj.completed && !obj.carried && obj.start.row === r && obj.start.col === c);
        return object ? object.number : 0;
    }

    hasAnEndPointOfObject(r, c) {
        const object = this.objects.find(obj => !obj.completed && obj.carried && obj.end.row === r && obj.end.col === c);
        return object ? object.number : 0;
    }

    getObjectAt(r, c) {
        const object = this.objects.find(obj => obj.start.row === r && obj.start.col === c);
        return object ? { number: object.number, color: object.color } : { number: 0, color: 'transparent' };
    }

    isPossibleAt(r, c) {
        return r >= 0 && r < this.size.row && c >= 0 && c < this.size.col;
    }

    objectPicked(objectNumber) {
        const object = this.objects.find(obj => obj.number === objectNumber);
        if (object) {
            object.carried = true;
            return true;
        }
        return false;
    }

    objectReleased(objectNumber, r, c) {
        const object = this.objects.find(obj => obj.number === objectNumber && obj.end.row === r && obj.end.col === c);
        if (object) {
            object.carried = false;
            object.completed = true;
            this.obstacles.push({ row: object.end.row, col: object.end.col });
            return true;
        }
        return false;
    }

    isCompleted() {
        return this.objects.every(obj => obj.completed);
    }
}

class VehicleView {
    constructor() {
        this.vehicle = document.getElementById('vehicle');
        this.object = document.getElementById('objectCarried');

        const container = document.querySelector('.animation-container');
        const containerWidth = container.clientWidth;
        this.gridSize = Math.floor(containerWidth / 5);
        this.width = Math.floor(this.gridSize * 0.5);
        this.height = Math.floor(this.gridSize * 0.7);
        this.vehicle.style.width = `${this.width}px`; 
        this.vehicle.style.height = `${this.height}px`;

        this.vehicle.style.left = `0px`;
        this.vehicle.style.top = `${this.gridSize * 4}px`;
        this.vehicle.style.transform = `translate(${-this.width / 2}px, ${-this.height / 2}px) rotate(0deg)`;
    }

    update(vehicleStatus) {
        const { row, col } = vehicleStatus.position;
        const heading = vehicleStatus.heading;
        const translateX = col * this.gridSize - this.width / 2;
        const translateY = -row * this.gridSize - this.height / 2;
        this.vehicle.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${heading}deg)`;
        if (vehicleStatus.object.carrying) {
            this.drawObject(vehicleStatus.object.color);
        } else {
            this.eraseObject();
        }
    }

    drawObject(color) {
        this.object.style.backgroundColor = color;
        this.object.style.border = `2px solid ${color}`;
    }

    eraseObject() {
        this.object.style.backgroundColor = 'transparent';
        this.object.style.border = '2px solid transparent';
    }

    resized(vehicleStatus) {
        const container = document.querySelector('.animation-container');
        const containerWidth = container.clientWidth;
        this.gridSize = Math.floor(containerWidth / 5);
        this.width = Math.floor(this.gridSize * 0.5);
        this.height = Math.floor(this.gridSize * 0.7);
        this.vehicle.style.width = `${this.width}px`; 
        this.vehicle.style.height = `${this.height}px`;

        this.vehicle.style.left = `0px`;
        this.vehicle.style.top = `${this.gridSize * 4}px`;

        if (vehicleStatus) {
            this.update(vehicleStatus);
        }
    }
}

class MapView {
    constructor() {
        const container = document.querySelector('.animation-container');
        const containerWidth = container.clientWidth;
        const containerHeight = Math.floor(containerWidth*0.8);
        container.style.height = `${containerHeight}px`;
        
        this.gridSize = containerWidth / 5; // Adjust as needed
        this.left = 0;
        this.top = containerHeight; // Center vertically
        this.obSize = 20;
    }

    createElement(className, r, c) {
        const element = document.createElement('div');
        element.className = className;
        element.style.left = `${this.left + this.gridSize * c - this.obSize / 2}px`;
        element.style.top = `${this.top - this.gridSize * r - this.obSize / 2}px`;
        return element;
    }

    drawObstacle(gridBox, r, c) {
        const obstacle = this.createElement('obstacle', r, c);
        gridBox.appendChild(obstacle);
    }

    drawObject(gridBox, r, c, color, filled) {
        const object = this.createElement('object', r, c);
        object.style.borderColor = color;
        if (filled) {
            object.style.backgroundColor = color;
            object.classList.add('filled');
        } else {
            object.style.backgroundColor = 'transparent';
            object.classList.add('empty');
        }
        gridBox.appendChild(object);
    }

    draw(mapStatus) {
        const gridBox = document.querySelector('.animation-container');
        const obstacles = gridBox.querySelectorAll('.obstacle');
        const objects = gridBox.querySelectorAll('.object');
        obstacles.forEach(element => element.remove());
        objects.forEach(element => element.remove());

        // Draw obstacles
        mapStatus.obstacles.forEach(obstacle => {
            this.drawObstacle(gridBox, obstacle.row, obstacle.col);
        });

        // Draw objects
        mapStatus.objects.forEach(object => {
            if (!object.completed) {
                this.drawObject(gridBox, object.end.row, object.end.col, object.color, false);
            }
            if (!object.carried && !object.completed) {
                this.drawObject(gridBox, object.start.row, object.start.col, object.color, true);
            }
        });
    }
    
    resized(mapStatus) {
        const container = document.querySelector('.animation-container');
        const containerWidth = container.clientWidth;
        const containerHeight = Math.floor(containerWidth*0.8);
        container.style.height = `${containerHeight}px`;

        this.gridSize = containerWidth / 5; // Adjust as needed
        this.left = 0;
        this.top = containerHeight; // Center vertically

        if (mapStatus) {
            this.draw(mapStatus);
        }
    }

    getGridSize() {
        const container = document.querySelector('.animation-container');
        const containerWidth = container.clientWidth;
        return Math.floor(containerWidth / 5);
    }
}

class LevelSelectionModal {
    constructor(gameInstance) {
        this.modal = document.getElementById('levelSelectionModal');
        this.gameInstance = gameInstance;
        this.initEventListeners();
    }

    initEventListeners() {
        // Close button event listener
        const closeButton = document.querySelector('.close-level-button');
        if (closeButton) {
            closeButton.onclick = this.closeModal.bind(this);
        }

        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target == this.modal) {
                this.closeModal();
            }
        });

        // Start game button event listener
        const levelButtons = this.modal.querySelectorAll('.level-button');
        levelButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                const selectedLevel = event.target.getAttribute('data-level');
                this.gameInstance.fetchAndProcessJson(selectedLevel);
                this.closeModal();
            });
        });

        // Open modal on window load
        window.addEventListener('load', this.openModal.bind(this));
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    isModalOpened() {
        return this.modal.style.display === 'block';
    }
}

class InstructionsModal {
    constructor() {
        this.modal = document.getElementById('instructionsModal');
        this.initEventListeners();
    }

    initEventListeners() {
        // Close button event listener
        const closeButton = document.querySelector('.close-instruction-button');
        if (closeButton) {
            closeButton.onclick = this.closeModal.bind(this);
        }

        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target == this.modal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    isModalOpened() {
        return this.modal.style.display === 'block';
    }
}

class Game {
    constructor() {
        this.vehicle = new VehicleStatus();
        this.vehicleView = new VehicleView(80, 40, 60);
        this.map = null;
        this.mapView = new MapView();
        this.actions = new ActionQueue('queue-list');
        this.levelSelectionModal = new LevelSelectionModal(this);
        this.instructionsModal = new InstructionsModal();
        this.gameData = null;
        this.currentMapIndex = null;
        this.initEventListeners();
    }

    initEventListeners() {
        // Initialize event listeners for buttons and keys
        const buttonIds = ['up-btn', 'left-btn', 'right-btn', 'func-btn', 'play-btn'];
        buttonIds.forEach((id) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', this.handleButtonClick.bind(this));
            } else {
                console.error('Button not found:', id);
            }
        });

        document.addEventListener('keydown', this.handleKeyPressed.bind(this));

        // Menu bar button event listeners
        const resetGameButton = document.getElementById('resetGameButton');
        const changeLevelButton = document.getElementById('changeLevelButton');
        const instructionsButton = document.getElementById('instructionsButton');

        if (resetGameButton) {
            resetGameButton.addEventListener('click', () => {
                if (this.gameData && this.currentMapIndex !== undefined) {
                    this.setupGame(this.gameData, this.currentMapIndex);
                } else {
                    this.levelSelectionModal.openModal();
                }
            });
        }
        

        if (changeLevelButton) {
            changeLevelButton.addEventListener('click', this.levelSelectionModal.openModal.bind(this.levelSelectionModal));
        }

        if (instructionsButton) {
            instructionsButton.addEventListener('click', this.instructionsModal.openModal.bind(this.instructionsModal));
        }

        window.addEventListener('resize', () => {
            try {
                this.mapView.resized(this.map.getStatus());
            } catch (error) {
                this.mapView.resized();
            }
            
            try {
                this.vehicleView.resized(this.vehicle.getStatus());
            } catch (error) {
                this.vehicleView.resized();
            }
        })
    }

    async fetchAndProcessJson(dataFile) {
        try {
            const response = await fetch(`data/${dataFile}.json`);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();
            this.gameData = data;
            this.setupGame(this.gameData);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            alert('Failed to load level data. Please try again.');
            this.modalHandler.openModal();
        }
    }

    setupGame(gameData, index = null) {
        if (index === null) {
            index = Math.floor(Math.random() * gameData.length);
        }
        const mapInfo = gameData[index];
        this.currentMapIndex = index; // Store the index of the current map
        this.vehicle = new VehicleStatus();
        this.vehicleView.update(this.vehicle.getStatus());
    
        this.map = new MapStatus(mapInfo);
        this.mapView.draw(this.map.getStatus());
        this.actions.clear();
    }

    handleButtonClick(event) {
        const buttonId = event.target.id;
        switch (buttonId) {
            case 'up-btn':
                this.handleMove('forward');
                break;
            case 'left-btn':
                this.handleMove('left');
                break;
            case 'right-btn':
                this.handleMove('right');
                break;
            case 'func-btn':
                this.handleMove('function');
                break;
            case 'play-btn':
                this.handleMove('finish');
                break;
            default:
                console.warn('Unknown button clicked:', buttonId);
                break;
        }
    }

    handleKeyPressed(event) {
        if (this.levelSelectionModal.isModalOpened() || this.instructionsModal.isModalOpened()) {
            return;
        }

        const eventKey = event.key;
        switch (eventKey) {
            case 'ArrowUp':
                this.handleMove('forward');
                break;
            case 'ArrowLeft':
                this.handleMove('left');
                break;
            case 'ArrowRight':
                this.handleMove('right');
                break;
            case ' ':
            case 'Spacebar':
            case 'Space':
                this.handleMove('function');
                event.preventDefault();
                break;
            case 'Backspace':
                this.handleMove('delete');
                break;
            case 'Enter':
                this.handleMove('finish');
                break;
            default:
                break;
        }
    }

    handleMove(action) {
        if (!this.map) {
            this.setupGame([
                {
                    "size" : [5, 6],
                    "obstacles" : [],
                    "objects" : []
                },
            ])
            this.currentMapIndex = 0;
        }

        const vehicleStatus = this.vehicle.getStatus();
        const currentRow = vehicleStatus.position.row;
        const currentCol = vehicleStatus.position.col;
        const nextPosition = vehicleStatus.nextPosition;
        const nextRow = nextPosition.row;
        const nextCol = nextPosition.col;

        switch (action) {
            case 'forward':
                if (!this.map.isPossibleAt(nextRow, nextCol)) {
                    alert('Out of map');
                    return;
                } else if (this.map.hasAnObstacle(nextRow, nextCol)) {
                    alert('There is an obstacle');
                    return;
                } else if (this.map.hasAnObject(nextRow, nextCol) && vehicleStatus.object.carrying) {
                    alert('You cannot pick up another object while carrying one');
                    return;
                } else if (this.map.hasAnObject(currentRow, currentCol) && !vehicleStatus.object.carrying) {
                    alert('You have to pick up the object first');
                    return;
                } else {
                    this.vehicle.moveForward();
                    this.vehicleView.update(this.vehicle.getStatus());
                    this.actions.push(action);
                }
                break;
            case 'left':
            case 'right':
                if (this.map.hasAnObject(currentRow, currentCol) && !vehicleStatus.object.carrying) {
                    alert('You have to pick up the object first');
                    return;
                } else {
                    this.vehicle.rotate(action);
                    this.vehicleView.update(this.vehicle.getStatus());
                    this.actions.push(action);
                }
                break;
            case 'function':
                const objectNumber = this.map.hasAnObject(currentRow, currentCol);
                if (objectNumber && !vehicleStatus.object.carrying) {
                    if (this.map.objectPicked(objectNumber)) {
                        const objectStatus = this.map.getObjectAt(currentRow, currentCol);
                        this.vehicle.grab(objectStatus);
                        this.vehicleView.update(this.vehicle.getStatus());
                        this.mapView.draw(this.map.getStatus());
                        this.actions.push(action);
                    }
                } else {
                    const objectEndPoint = this.map.hasAnEndPointOfObject(currentRow, currentCol);
                    if (!objectEndPoint) {
                        if (vehicleStatus.object.carrying) {
                            alert('Put it in the right place');
                        } else {
                            alert('Nothing to grab');
                        }
                    } else if (this.map.objectReleased(vehicleStatus.object.number, currentRow, currentCol)) {
                        this.vehicle.release();
                        this.vehicleView.update(this.vehicle.getStatus());
                        this.mapView.draw(this.map.getStatus());
                        this.actions.push(action);
                    }
                }
                break;
            case 'delete':
                this.actions.pop();
                break;
            case 'finish':
                if (currentRow === 0 && currentCol === 0 && this.map.isCompleted()) {
                    alert('CLEAR!');
                    // this.gameData = null;
                    // this.currentMapIndex = null;
                    this.levelSelectionModal.openModal();
                } else {
                    alert('Go to the starting position');
                }
                break;
            default:
                break;
        }
    }
}

// Initialize the game
const game = new Game();
