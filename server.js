const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// سرو کردن فایل‌های استاتیک
app.use(express.static('./'));

// نگهداری اطلاعات بازیکنان
const players = new Map();

io.on('connection', (socket) => {
    console.log('یک بازیکن جدید متصل شد');
    
    // ایجاد یک بازیکن جدید
    const player = {
        id: socket.id,
        x: Math.random() * 500 + 50,
        y: Math.random() * 300 + 50,
        color: '#ff4444',
        name: `بازیکن ${players.size + 1}`
    };
    
    players.set(socket.id, player);
    
    // ارسال اطلاعات بازیکن جدید به همه
    io.emit('playerJoined', {
        players: Array.from(players.values())
    });
    
    // دریافت حرکت بازیکن
    socket.on('playerMove', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.color = data.color;
            io.emit('playerMoved', {
                id: socket.id,
                x: player.x,
                y: player.y,
                color: player.color
            });
        }
    });
    
    // وقتی بازیکن قطع می‌شود
    socket.on('disconnect', () => {
        console.log('یک بازیکن قطع شد');
        players.delete(socket.id);
        io.emit('playerLeft', {
            id: socket.id
        });
    });
});

// شروع سرور
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`سرور در پورت ${PORT} در حال اجراست`);
}); 