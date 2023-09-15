let state = {
    isOwned: false,
    isStarted: false,
    conf: undefined,
    wss: []
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
                }
            }
        },
        close(ws) {
            
        }
    },
    port: 3001
});
function mapGen(x){
    if(x == "default"){
        let map = [];
        for(let y=0;y<11;y++){
            map.push([]);
            for(let x=0;x<13;x++){
                map[y].push(Math.round(Math.random()));
            }
        }
        return map;
    } else {
        throw "b0zo";
    }
}
console.log(`Listening on http://localhost:${server.port}`);