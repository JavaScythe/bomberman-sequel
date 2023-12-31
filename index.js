let state = {
    isOwned: false,
    isStarted: false,
    conf: undefined,
    wss: [],
    map: undefined,
    playerExacts: {
        "p0": {
            x: 0,
            y: 0
        },
        "p1": {
            x: 12,
            y: 0
        },
        "p2": {
            x: 0,
            y: 10
        },
        "p3": {
            x: 12,
            y: 10
        }
    },
    playerKeyStates: {
        "p0": [],
        "p1": [],
        "p2": [],
        "p3": []
    }
}
const server = Bun.serve({
    fetch(req, server) {
        const success = server.upgrade(req);
        if (success) {
            return undefined;
        }
        if(state.isOwned){
            return new Response(Bun.file("client.html"));
        } else if(state.isStarted){
            return new Response(Bun.file("started.html"));
        } else {
            return new Response(Bun.file("host.html"));
        }
    },
    websocket: {
        async message(ws, message) {
            try{
                message = JSON.parse(message);
            } catch(e){
                console.log("malformed send");
            }
            if(message.reg == true && state.isOwned == false){
                ws.owner = true;
                console.log("everyday");
                state.isOwned=true;
                state.wss.push(ws);
                return;
            } else if(message.reg == true){
                state.wss.push(ws);
                return;
            } else if (message.type == "keyu"){
                think(message.key, ws.player, "u");
            } else if(message.type == "keyd"){
                think(message.key, ws.player, "d");
            }
            if(ws.owner == true && state.isStarted == false){
                state.conf = message;
                state.isStarted = true;
                console.log("LESGO");
                if (state.conf.map) {
                state.map = mapGen(state.conf.map);
                } else {
                    console.log(state.conf.map);
                }
                for(let i in state.wss){
                    state.wss[i].send(JSON.stringify({
                        type: "map",
                        map: state.map
                    }));
                    state.wss[i].send(JSON.stringify({
                        type: "things",
                        things: state.things
                    }));
                    state.wss[i].player = "p"+i;
                }
            }
        },
        close(ws) {
            
        }
    },
    port: 3002
});
function think(k,p,m){
    if(m=="u"){
        state.playerKeyStates[p].splice(state.playerKeyStates[p].indexOf(k),1);
    } else if(m=="d"){
        if(state.playerKeyStates[p].indexOf(k)==-1) state.playerKeyStates[p].push(k);
    }
}
setInterval(function(){
    const mvspd = 0.4;
    if(state.isStarted){
        for(let i in state.playerKeyStates){
            for(let k in state.playerKeyStates[i]){
                if(state.playerKeyStates[i][k] == "ArrowLeft"){
                    playerMove(i, -1*mvspd, 0);
                } else if(state.playerKeyStates[i][k] == "ArrowRight"){
                    playerMove(i, mvspd, 0);
                } else if(state.playerKeyStates[i][k] == "ArrowUp"){
                    playerMove(i, 0, -1*mvspd);
                } else if(state.playerKeyStates[i][k] == "ArrowDown"){
                    playerMove(i, 0, mvspd);
                }
            }
        }
    }
}, 1000/10);
function playerMove(p, x, y){
    state.playerExacts[p].x += x;
    state.playerExacts[p].y += y;

    if(state.playerExacts[p].x < 0) state.playerExacts[p].x = 0;
    if(state.playerExacts[p].y < 0) state.playerExacts[p].y = 0;
    if(state.playerExacts[p].x > 12) state.playerExacts[p].x = 12;
    if(state.playerExacts[p].y > 10) state.playerExacts[p].y = 10;


    broadcast({
        "type":"px",
        "player": p,
        "x": state.playerExacts[p].x,
        "y": state.playerExacts[p].y
    });
}
function broadcast(m){
    //console.log(m);
    for(let i in state.wss){
        state.wss[i].send(JSON.stringify(m));
    }
}
function mapGen(x){
    const mapConst = ["", "X"];
    if(x == "default"){
            const mapWidth = 13; 
            const mapHeight = 11;

            let map = [];
            for (let y = 0; y < mapHeight; y++) {
            let row = [];
                for (let x = 0; x < mapWidth; x++) {
                    row.push('#'); //populate math
                }
            map.push(row);
            }

                for (let y = 1; y < mapHeight - 1; y++) {
                    for (let x = 1; x < mapWidth - 1; x++) {
                        if (Math.random() < 0.55) { 
                            if (Math.random() < 0.55 && isSafeToPlaceU(x, y)) {
                                map[y][x] = 'U'; // about half are unbreakable
                            }
                            else {
                                map[y][x] = ''; // empty spaces
                            } 
                        }
                    }
                }

            function isSafeToPlaceU(x, y) { //check if it's safe to place U
                const neighbors = [
                    map[y - 1][x],
                    map[y + 1][x],
                    map[y][x - 1],
                    map[y][x + 1]
                ];

                return neighbors.indexOf('U') === -1;
            }


            const numOs = Math.floor(Math.random() * (mapHeight * mapWidth * 0.1)); // density of powerups
                for (let i = 0; i < numOs; i++) {
                    const x = Math.floor(Math.random() * (mapWidth - 2)) + 1;
                    const y = Math.floor(Math.random() * (mapHeight - 2)) + 1;
                    map[y][x] = 'O'; //powerup, both breakable and powerup
                }

            //ensure spawn pts are clear
            map[0][0] = '';
            map[1][0] = '';
            map[0][1] = ''; // top left
            map[0][mapWidth - 1] = '';
            map[0][mapWidth - 2] = '';
            map[mapHeight - 1][mapWidth - 1] = '';
            map[mapHeight - 1][0] = '';
            map[mapHeight - 2][0] = '';
            map[mapHeight - 2][mapWidth - 1] = '';
            map[mapHeight - 1][mapWidth - 1] = '';
            map[mapHeight - 1][mapWidth - 1] = '';

            const mapString = map.map(row => row.join('')).join('\n');
            console.log(mapString);
        return map;
    } else {
        throw "b0zo";
    }
}
console.log(`Listening on http://localhost:${server.port}`);