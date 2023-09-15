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
    playerKeyStates: []
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
            console.log("got ", message);
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
                think(message.key, ws.player);
            }
            if(ws.owner == true && state.isStarted == false){
                state.conf = message;
                state.isStarted = true;
                console.log("LESGO");
                state.map = mapGen(state.conf.map);
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
    port: 3001
});
function think(k,p){
    if(k == "ArrowRight"){
        state.playerExacts[p].x+=0.1;
        console.log("updated");
        broadcast({
            "type":"px",
            "player": p,
            "x": state.playerExacts[p].x,
            "y": state.playerExacts[p].y
        })
    }
}
function broadcast(m){
    console.log(m);
    for(let i in state.wss){
        state.wss[i].send(JSON.stringify(m));
    }
}
function mapGen(x){
    const mapConst = ["", "X"];
    if(x == "default"){
        let map = [];
        for(let y=0;y<11;y++){
            map.push([]);
            for(let x=0;x<13;x++){
                map[y].push(mapConst[Math.floor(Math.random()*mapConst.length)]);
            }
        }
        map[0][0] = "p0";
        map[0][12] = "p1";
        map[10][0] = "p2";
        map[10][12] = "p3";
        return map;
    } else {
        throw "b0zo";
    }
}
console.log(`Listening on http://localhost:${server.port}`);