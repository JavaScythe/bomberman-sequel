let state = {
    isOwned: false,
    isStarted: false,
    conf: undefined
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
            if(ws.reg == true && !isOwned){
                ws.owner = true;
                isOwned=true;
                return;
            }
            if(ws.owner == true && isStarted == false){
                state.conf = message;
            }
        },
        close(ws) {
            
        }
    },
    port: 3001
});
console.log(`Listening on http://localhost:${server.port}`);