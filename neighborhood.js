class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 400;
        
        this.player = {
            x: 300,
            y: 200,
            color: '#ff4444',
            size: 20,
            speed: 5
        };
        
        this.otherPlayers = new Map();
        
        this.buildings = [
            { x: 100, y: 100, width: 80, height: 80 },
            { x: 200, y: 150, width: 100, height: 60 },
            { x: 350, y: 100, width: 60, height: 100 },
            { x: 450, y: 150, width: 80, height: 80 }
        ];
        
        this.roads = [
            { x: 0, y: 200, width: 600, height: 40 },  // خیابان افقی
            { x: 300, y: 0, width: 40, height: 400 }   // خیابان عمودی
        ];
        
        this.setupSocketIO();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupSocketIO() {
        this.socket = io();
        
        // وقتی بازیکن جدیدی می‌پیوندد
        this.socket.on('playerJoined', (data) => {
            data.players.forEach(player => {
                if (player.id !== this.socket.id) {
                    this.otherPlayers.set(player.id, player);
                }
            });
        });
        
        // وقتی بازیکنی حرکت می‌کند
        this.socket.on('playerMoved', (data) => {
            if (this.otherPlayers.has(data.id)) {
                const player = this.otherPlayers.get(data.id);
                player.x = data.x;
                player.y = data.y;
                player.color = data.color;
            }
        });
        
        // وقتی بازیکنی خارج می‌شود
        this.socket.on('playerLeft', (data) => {
            this.otherPlayers.delete(data.id);
        });
    }
    
    setupEventListeners() {
        // انتخاب کاراکتر
        document.querySelectorAll('.character').forEach(char => {
            char.addEventListener('click', () => {
                this.player.color = char.dataset.color;
                this.socket.emit('playerMove', {
                    x: this.player.x,
                    y: this.player.y,
                    color: this.player.color
                });
            });
        });
        
        // کنترل حرکت
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.player.y -= this.player.speed;
                    break;
                case 'ArrowDown':
                    this.player.y += this.player.speed;
                    break;
                case 'ArrowLeft':
                    this.player.x -= this.player.speed;
                    break;
                case 'ArrowRight':
                    this.player.x += this.player.speed;
                    break;
            }
            
            // محدود کردن حرکت به داخل کانوس
            this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.size, this.player.x));
            this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.size, this.player.y));
            
            // ارسال موقعیت جدید به سرور
            this.socket.emit('playerMove', {
                x: this.player.x,
                y: this.player.y,
                color: this.player.color
            });
        });
    }
    
    draw() {
        // پاک کردن کانوس
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم ساختمان‌ها
        this.ctx.fillStyle = '#666';
        this.buildings.forEach(building => {
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
        });
        
        // رسم خیابان‌ها
        this.ctx.fillStyle = '#333';
        this.roads.forEach(road => {
            this.ctx.fillRect(road.x, road.y, road.width, road.height);
        });
        
        // رسم خطوط خیابان
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.roads.forEach(road => {
            if (road.width > road.height) {
                // خطوط خیابان افقی
                for (let x = 0; x < road.width; x += 40) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, road.y + road.height/2);
                    this.ctx.lineTo(x + 20, road.y + road.height/2);
                    this.ctx.stroke();
                }
            } else {
                // خطوط خیابان عمودی
                for (let y = 0; y < road.height; y += 40) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(road.x + road.width/2, y);
                    this.ctx.lineTo(road.x + road.width/2, y + 20);
                    this.ctx.stroke();
                }
            }
        });
        
        // رسم بازیکنان دیگر
        this.otherPlayers.forEach(player => {
            this.ctx.fillStyle = player.color;
            this.ctx.beginPath();
            this.ctx.arc(
                player.x + this.player.size/2,
                player.y + this.player.size/2,
                this.player.size/2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // رسم بازیکن اصلی
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.x + this.player.size/2,
            this.player.y + this.player.size/2,
            this.player.size/2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// شروع بازی
window.addEventListener('load', () => {
    new Game();
}); 