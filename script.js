class ActionQueue {
    constructor(queueClassName) {
        // Set Action Queue
        this.queueList = [];

        // Get Element
        this.queueElement = document.getElementById(queueClassName);
    }

    push(action) {
        // Add Action to Queue
        this.queueList.push(action);

        // Add New Action Element to Screen
        const actionText = this.getActionText(action);
        const newActionElement = document.createElement('li');
        newActionElement.textContent = actionText;
        this.queueElement.appendChild(newActionElement);
    }

    pop() {
        if (this.queueList.length > 0) {
            // Pop Action from Queue
            this.queueList.pop();

            // Delete Action Element from Screen
            if (this.queueElement.lastChild) {
                this.queueElement.removeChild(this.queueElement.lastChild);
            }
        }
    }

    clear() {
        // Reset Action Queue
        this.queueList = [];

        // Remove All Action Elements from Screen
        while (this.queueElement.lastChild) {
            this.queueElement.removeChild(this.queueElement.lastChild);
        }
    }

    getActionText(action) {
        const actionMap = {
            'forward': '⬆️',
            'left': '⬅️',
            'right': '➡️',
            'function': '⏹️'
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

    setHeading() {
        this.heading = 0;
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
    // Draw Vehicle on Screen with vehicleStatus : update(vehicleStatus)

    constructor() {
        // Get Elements
        this.vehicle = document.getElementById('vehicle');
        this.object = document.getElementById('objectCarried');
        const container = document.querySelector('.animation-container');

        // Measure Size
        const containerWidth = container.clientWidth;
        this.gridSize = Math.floor(containerWidth / 5);
        this.width = Math.floor(this.gridSize * 0.5);
        this.height = Math.floor(this.gridSize * 0.7);

        // Set Style
        this.vehicle.style.width = `${this.width}px`; 
        this.vehicle.style.height = `${this.height}px`;
        this.vehicle.style.left = `0px`;
        this.vehicle.style.top = `${this.gridSize * 4}px`;
        this.vehicle.style.transform = `translate(${-this.width / 2}px, ${-this.height / 2}px) rotate(0deg)`;
    }

    update(vehicleStatus) {
        // Measure Size
        const { row, col } = vehicleStatus.position;
        const heading = vehicleStatus.heading;
        const translateX = col * this.gridSize - this.width / 2;
        const translateY = -row * this.gridSize - this.height / 2;

        // Set Style
        this.vehicle.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${heading}deg)`;

        // Show Object Status
        if (vehicleStatus.object.carrying) {
            this.drawObject(vehicleStatus.object.color);
        } else {
            this.eraseObject();
        }
    }

    drawObject(color) {
        // Show Object on Vehicle
        this.object.style.backgroundColor = color;
        this.object.style.border = `2px solid ${color}`;
    }

    eraseObject() {
        // Hide Object on Vehicle
        this.object.style.backgroundColor = 'transparent';
        this.object.style.border = '2px solid transparent';
    }

    resized(vehicleStatus) {
        // Get Element
        const container = document.querySelector('.animation-container');

        // Measure Size
        const containerWidth = container.clientWidth;
        this.gridSize = Math.floor(containerWidth / 5);
        this.width = Math.floor(this.gridSize * 0.5);
        this.height = Math.floor(this.gridSize * 0.7);

        // Set Style
        this.vehicle.style.width = `${this.width}px`; 
        this.vehicle.style.height = `${this.height}px`;
        this.vehicle.style.left = `0px`;
        this.vehicle.style.top = `${this.gridSize * 4}px`;

        // Update
        if (vehicleStatus) {
            this.update(vehicleStatus);
        }
    }
}

class MapView {
    // Draw Map on Screen with mapStatus : draw(mapStatus)

    constructor() {
        // Get Element
        const container = document.querySelector('.animation-container');

        // Measure Size
        const containerWidth = container.clientWidth;
        const containerHeight = Math.floor(containerWidth*0.8);
        this.gridSize = containerWidth / 5;
        this.left = 0;
        this.top = containerHeight;
        this.obSize = 20;

        // Set Style
        container.style.height = `${containerHeight}px`;
    }

    createElement(className, r, c) {
        // Get Element
        const element = document.createElement('div');

        // Set Class
        element.className = className;

        // Set Style
        element.style.left = `${this.left + this.gridSize * c - this.obSize / 2}px`;
        element.style.top = `${this.top - this.gridSize * r - this.obSize / 2}px`;

        return element;
    }

    drawObstacle(map, r, c) {
        // Get Element
        const obstacle = this.createElement('obstacle', r, c);

        // Add Element to Map
        map.appendChild(obstacle);
    }

    drawObject(map, r, c, color, filled) {
        // Create Empty Element
        const object = this.createElement('object', r, c);

        // Set Style and Class
        object.style.borderColor = color;
        if (filled) {
            object.style.backgroundColor = color;
            object.classList.add('filled');
        } else {
            object.style.backgroundColor = 'transparent';
            object.classList.add('empty');
        }

        // Add Object to Map
        map.appendChild(object);
    }

    draw(mapStatus) {
        // Get Elements
        const map = document.querySelector('.animation-container');
        const obstacles = map.querySelectorAll('.obstacle');
        const objects = map.querySelectorAll('.object');

        // Delete Existing Obstacles and Objects on Map
        obstacles.forEach(element => element.remove());
        objects.forEach(element => element.remove());

        // Draw Obstacles
        mapStatus.obstacles.forEach(obstacle => {
            this.drawObstacle(map, obstacle.row, obstacle.col);
        });

        // Draw Objects
        mapStatus.objects.forEach(object => {
            // When Object is Not Completed (Completed Obejcts Changes to Obstacles)
            if (!object.completed) {
                this.drawObject(map, object.end.row, object.end.col, object.color, false);
            }
            // When Object is Carried
            if (!object.carried && !object.completed) {
                this.drawObject(map, object.start.row, object.start.col, object.color, true);
            }
        });
    }
    
    resized(mapStatus) {
        // Get Element
        const container = document.querySelector('.animation-container');

        // Measure Size
        const containerWidth = container.clientWidth;
        const containerHeight = Math.floor(containerWidth*0.8);
        this.gridSize = containerWidth / 5;
        this.left = 0;
        this.top = containerHeight;

        // Set Style
        container.style.height = `${containerHeight}px`;

        // Draw Map
        if (mapStatus) {
            this.draw(mapStatus);
        }
    }

    getGridSize() {
        // Get Element
        const container = document.querySelector('.animation-container');

        // Measure Size
        const containerWidth = container.clientWidth;

        return Math.floor(containerWidth / 5);
    }
}

class LevelSelectionModal {
    // Control Level Selection Modal

    constructor(game) {
        // Get Element
        this.modal = document.getElementById('levelSelectionModal');

        // Set Event Listeners
        this.initEventListeners(game);
    }

    initEventListeners(game) {
        // Get Element
        const closeButton = document.querySelector('.close-level-button');

        // Close Modal When Button Clicked
        if (closeButton) {
            closeButton.onclick = this.closeModal.bind(this);
        }

        // Close Modal When Clicking Outside of it
        window.addEventListener('click', (event) => {
            if (event.target == this.modal) {
                this.closeModal();
            }
        });

        // Set Level Selection Event Listeners
        const levelButtons = this.modal.querySelectorAll('.level-button');
        levelButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                const selectedLevel = event.target.getAttribute('data-level');
                game.start(selectedLevel);
                this.closeModal();
            });
        });

        // Open Modal on Window Load
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
        // Get Element
        this.modal = document.getElementById('instructionsModal');

        // Set Event Listeners
        this.initEventListeners();
    }

    initEventListeners() {
        // Get Element
        const closeButton = document.querySelector('.close-instruction-button');

        // Close Modal When Button Clicked
        if (closeButton) {
            closeButton.onclick = this.closeModal.bind(this);
        }

        // Close Modal When Clicking Outside of it
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
        // Set Unchanging Game Status
        this.actions = new ActionQueue('queue-list');
        this.levelSelectionModal = new LevelSelectionModal(this);
        this.instructionsModal = new InstructionsModal();

        // Set Game Data
        this.gameData = null;
        this.currentMapIndex = 0;
        this.setDefaultGameData();

        // Set Game Status
        this.mode = 'simulator';
        this.map = new MapStatus(this.gameData[this.currentMapIndex]);
        this.mapView = new MapView();
        this.vehicle = new VehicleStatus();
        this.vehicleView = new VehicleView();

        // Set Event Handler
        this.initEventListeners();
    }

    setDefaultGameData() {
        this.gameData = [
            {
                "size" : [5, 6],
                "obstacles" : [],
                "objects" : []
            }
        ];
        this.currentMapIndex = 0;
    }

    initEventListeners() {
        // Button Event
        this.initControlButtonListners();
        this.initResetButtonListener();
        this.initLevelSelectionButtonListener();
        this.initModeChangeButtonListener();
        this.initInstructionButtonListener();

        // Key Event
        document.addEventListener('keydown', this.handleKeyPressed.bind(this));

        // Screen Resize Event
        this.initResizeEventListener();
    }

    handleButtonClick(event) {
        // Handle Button Event
        const buttonId = event.target.id;
        if (buttonId === 'up-btn') {
            this.handleMove('forward');
        } else if (buttonId === 'left-btn') {
            this.handleMove('left');
        } else if (buttonId === 'right-btn') {
            this.handleMove('right');
        } else if (buttonId === 'func-btn') {
            this.handleMove('function');
        } else if (buttonId === 'delete-btn') {
            this.handleMove('delete');
        } else if (buttonId === 'play-btn') {
            this.handleMove('finish');
        }
    }

    handleKeyPressed(event) {
        // Do Not Get Key Event When Modal is Open
        if (this.levelSelectionModal.isModalOpened() || this.instructionsModal.isModalOpened()) {
            return 0;
        }

        // Handle Key Event
        const eventKey = event.key;
        if (eventKey === 'ArrowUp') {
            this.handleMove('forward');
        } else if (eventKey === 'ArrowLeft') {
            this.handleMove('left');
        } else if (eventKey === 'ArrowRight') {
            this.handleMove('right');
        } else if (eventKey === ' ' || eventKey === 'Spacebar' || eventKey === 'Space') {
            this.handleMove('function');
            event.preventDefault();
        } else if (eventKey === 'Backspace') {
            this.handleMove('delete');
        } else if (eventKey === 'Enter') {
            this.handleMove('finish');
        }
    }

    initControlButtonListners() {
        const buttonIds = ['up-btn', 'left-btn', 'right-btn', 'func-btn', 'play-btn', 'delete-btn'];
        buttonIds.forEach((id) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', this.handleButtonClick.bind(this));
            }
        });
    }

    initResetButtonListener() {
        const resetGameButton = document.getElementById('resetGameButton');
        if (resetGameButton) {
            resetGameButton.addEventListener('click', () => {
                this.setupGame(false, true);
            });
        }
    }

    initLevelSelectionButtonListener() {
        const levelSelectionButton = document.getElementById('changeLevelButton');
        if (levelSelectionButton) {
            levelSelectionButton.addEventListener('click', this.levelSelectionModal.openModal.bind(this.levelSelectionModal));
        }
    }

    initModeChangeButtonListener() {
        const instructionsButton = document.getElementById('modeChangeButton');
        if (instructionsButton) {
            instructionsButton.addEventListener('click', () => {
                this.changeMode();
            })
        }
    }

    initInstructionButtonListener() {
        const instructionsButton = document.getElementById('instructionsButton');
        if (instructionsButton) {
            instructionsButton.addEventListener('click', this.instructionsModal.openModal.bind(this.instructionsModal));
        }
    }

    initResizeEventListener() {
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

    start(level) {
        this.fetchJsonAndSetupGame(level);
    }
    
    async fetchJsonAndSetupGame(level) {
        try {
            // Fetch Json
            const response = await fetch(`data/${level}.json`);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const data = await response.json();

            // Set Game Data
            this.gameData = data;

            // Set Up Game
            this.setupGame(true, true);  
        } 
        catch (error) {
            // Show Error Message
            console.error('There was a problem with the fetch operation:', error);
            alert('Failed to load level data. Please try again.');

            // Open Level Selection Modal
            this.setupGame(false, true);
            this.levelSelectionModal.openModal();
        }
    }

    setupGame(newGame = false, codeClear = false) {
        // Get Random Index from Game Data Size
        if (newGame) {
            const index = Math.floor(Math.random() * this.gameData.length);
        this.currentMapIndex = index;
        }

        // Set Changing Game Status
        const mapInfo = this.gameData[this.currentMapIndex];
        this.map = new MapStatus(mapInfo);
        this.mapView.draw(this.map.getStatus());
        this.vehicle = new VehicleStatus();
        this.vehicleView.update(this.vehicle.getStatus());
        
        // Code Clear When Required
        if (codeClear) {
            this.actions.clear();
        }
    }

    changeMode() {
        const deleteButton = document.getElementById('delete-btn');
        const modeChangeButton = document.getElementById('modeChangeButton');
        if (this.mode === 'coding') {
            this.mode = 'simulator';
            deleteButton.style.display = `none`;
            modeChangeButton.textContent = `🚗`;
            this.setupGame(false, true);
        } else {
            this.mode = 'coding';
            deleteButton.style.display = `inline`;
            modeChangeButton.textContent = `💻`;
            this.setupGame(false, true);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async handleMove(action) {
        if (this.mode === 'coding') {
            await this.handleMoveOnCodingMode(action);
        } else if (this.mode === 'simulator') {
            this.handleMoveOnSimulatorMode(action);
        }
    }

    async handleMoveOnCodingMode(action) {
        if (action === 'forward' || action === 'left' || action === 'right' || action === 'function') {
            this.actions.push(action);
        } else if (action === 'delete') {
            this.actions.pop();
        } else if (action === 'finish') {
            let success = false;

            for (let i=0; i<this.actions.queueList.length; i++) {    
                const act = this.actions.queueList[i];
                let vehicleStatus = this.vehicle.getStatus();
                success = false;

                if (act === 'forward') {
                    let result = this.isPossibleMoveFoward(vehicleStatus);
                    if (result.result) {
                        this.vehicle.moveForward();
                        this.vehicleView.update(this.vehicle.getStatus());
                        success = true;
                    } else {
                        alert(result.message);                        
                    }
                } else if (act === 'left' || act === 'right') {
                    let result = this.isPossibleToRotate(vehicleStatus);
                    if (result.result) {
                        this.vehicle.rotate(act);
                        this.vehicleView.update(this.vehicle.getStatus());
                        success = true;
                    } else {
                        alert(result.message);
                    }
                } else if (act === 'function') {
                    let result = this.isPossibleToPickUpOfDropOff(vehicleStatus);
                    if (result.result === 'pickUp') {
                        let currentRow = vehicleStatus.position.row;
                        let currentCol = vehicleStatus.position.col;
                        this.vehicle.grab(this.map.getObjectAt(currentRow, currentCol));
                        this.vehicleView.update(this.vehicle.getStatus());
                        this.mapView.draw(this.map.getStatus());
                        success = true;
                    } else if (result.result === 'dropOff') {
                        this.vehicle.release();
                        this.vehicleView.update(this.vehicle.getStatus());
                        this.mapView.draw(this.map.getStatus());
                        success = true;
                    } else {
                        alert(result.message);
                    }
                }

                if (success) {
                    await this.delay(300);
                } else {
                    this.setupGame();
                    break;
                }
            }

            if (success) {
                let vehicleStatus = this.vehicle.getStatus();
                let result = this.isPossibleToFinishGame(vehicleStatus);

                if (result.result) {
                    alert(result.message);
                    this.setupGame(false, false);
                    this.levelSelectionModal.openModal();
                } else {
                    alert(result.message);
                    this.setupGame(false, false);
                }
            }
        }
    }

    async handleMoveOnSimulatorMode(action) {
        const vehicleStatus = this.vehicle.getStatus();

        if (action === 'forward') {
            let result = this.isPossibleMoveFoward(vehicleStatus);
            if (result.result) {
                this.vehicle.moveForward();
                this.vehicleView.update(this.vehicle.getStatus());
                this.actions.push(action);
            } else {
                alert(result.message);                        
            }
        } else if (action === 'left' || action == 'right') {
            let result = this.isPossibleToRotate(vehicleStatus);
            if (result.result) {
                this.vehicle.rotate(action);
                this.vehicleView.update(this.vehicle.getStatus());
                this.actions.push(action)
            } else {
                alert(result.message);
            }
        } else if (action === 'function') {
            let result = this.isPossibleToPickUpOfDropOff(vehicleStatus);
            if (result.result === 'pickUp') {
                let currentRow = vehicleStatus.position.row;
                let currentCol = vehicleStatus.position.col;
                this.vehicle.grab(this.map.getObjectAt(currentRow, currentCol));
                this.vehicleView.update(this.vehicle.getStatus());
                this.mapView.draw(this.map.getStatus());
                this.actions.push(action);
            } else if (result.result === 'dropOff') {
                this.vehicle.release();
                this.vehicleView.update(this.vehicle.getStatus());
                this.mapView.draw(this.map.getStatus());
                this.actions.push(action);
            } else {
                alert(result.message);
            }
        } else if (action === 'delete') {
            alert('Not supported')
        } else if (action === 'finish') {
            let vehicleStatus = this.vehicle.getStatus();
            let result = this.isPossibleToFinishGame(vehicleStatus);
            if (result.result) {
                alert(result.message);
                this.setupGame(false, true);
                this.levelSelectionModal.openModal();
            } else {
                alert(result.message);
            }
        }
    }

    isPossibleMoveFoward(vehicleStatus) {
        let currentRow = vehicleStatus.position.row;
        let currentCol = vehicleStatus.position.col;
        let nextRow = vehicleStatus.nextPosition.row;
        let nextCol = vehicleStatus.nextPosition.col;

        let res = false;
        let msg = '';

        if (!this.map.isPossibleAt(nextRow, nextCol)) {
            msg = '[ERROR] Out of Map';
        } else if (this.map.hasAnObstacle(nextRow, nextCol)) {
            msg = '[ERROR] There is an Obstacle';
        } else if (this.map.hasAnObject(nextRow, nextCol) && vehicleStatus.object.carrying) {
            msg = '[ERROR] You Cannot Pick Up Another Object While Carrying One';
        } else if (this.map.hasAnObject(currentRow, currentCol) && !vehicleStatus.object.carrying) {
            msg = '[ERROR] You Have to Pick Up the Object First';
        } else {
            res = true;
            msg = '';
        }

        return {
            result : res,
            message : msg
        }
    }

    isPossibleToRotate(vehicleStatus) {
        let currentRow = vehicleStatus.position.row;
        let currentCol = vehicleStatus.position.col;
        let carrying = vehicleStatus.object.carrying;

        let res = false;
        let msg = '';

        if (this.map.hasAnObject(currentRow, currentCol) && !carrying) {
            msg = '[ERROR] You Have to Pick Up the Object First';
        } else {
            res = true;
            msg = '';
        }

        return {
            result : res,
            message : msg
        }
    }

    isPossibleToPickUpOfDropOff(vehicleStatus) {
        let currentRow = vehicleStatus.position.row;
        let currentCol = vehicleStatus.position.col;
        let carrying = vehicleStatus.object.carrying;
        let caryyingNumber = vehicleStatus.object.number;

        let res = false;
        let msg = '';

        // Pick Up the Object
        const objectNumber = this.map.hasAnObject(currentRow, currentCol);
        if (!carrying && objectNumber) {
            res = this.map.objectPicked(objectNumber);
            res = res ? 'pickUp' : '[ERROR] : Something Wrong';
            msg = res;
        }
        // Drop Off the Object
        else {
            const isEndPoint = this.map.hasAnEndPointOfObject(currentRow, currentCol);
            if (isEndPoint) {
                res = this.map.objectReleased(caryyingNumber, currentRow, currentCol);
                res = res ? 'dropOff' : '[ERROR] : Something Wrong'
            } else {
                if (carrying) {
                    msg = '[ERROR] : Put it in the right place';
                } else {
                    msg = '[ERROR] : Nothing to grab';
                }
            }
        }

        return {
            result : res,
            message : msg
        }
    }

    isPossibleToFinishGame(vehicleStatus) {
        let currentRow = vehicleStatus.position.row;
        let currentCol = vehicleStatus.position.col;

        let res = false;
        let msg = '';

        // At Starting Point
        if (currentRow === 0 && currentCol === 0 && this.map.isCompleted()) {
            res = true;
            msg = 'CLEAR!';
        } else {
            msg = '[ERROR] Finish Tasks and Go to the Starting Position';
        }

        return {
            result : res,
            message : msg
        }
    }
}


// Initialize the game
const game = new Game();
