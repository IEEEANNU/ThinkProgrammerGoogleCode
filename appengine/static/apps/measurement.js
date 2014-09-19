
function createMeasurement(canv){
    var ctx = canv.getContext("2d");
    canv.onclick = click;
    var xpoints = [];
    var ypoints = [];
    function click(e){
        ctx.clearRect(0,0,400,400);
        var rect = canv.getBoundingClientRect();
        xpoints.push((e.clientX - rect.left));
        ypoints.push((e.clientY - rect.top));
        switch(xpoints.length){
            case 3:
                drawAngle(xpoints[0], ypoints[0], xpoints[1], ypoints[1], xpoints[2], ypoints[2]);
                drawLine(xpoints[1], ypoints[1], xpoints[2], ypoints[2]);
                drawPoint(xpoints[2], ypoints[2]);
            case 2:
                drawLine(xpoints[0], ypoints[0], xpoints[1], ypoints[1]);
                drawPoint(xpoints[1], ypoints[1]);
            case 1:
                drawPoint(xpoints[0], ypoints[0]);
                break;
            default:
                xpoints = [];
                ypoints = [];
        }
    }
    
    function drawLine(startX, startY, toX, toY){
        ctx.strokeStyle = '#00f';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(toX,toY);
        ctx.stroke();
        ctx.fillStyle = '#00f';
        ctx.fillText(""+Math.floor(Math.sqrt(Math.pow(startX - toX, 2) + Math.pow(startY - toY,2))), (startX + toX)/2+5, (startY + toY)/2+5);
        
    }
    
    function drawPoint(xp, yp){
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(xp, yp, 3, 0, 2*Math.PI);
        ctx.fill();
        ctx.fillText("("+Math.floor(xp-200)+","+Math.floor(-yp+200)+")", xp+5, yp-5);
    }
    
    function drawAngle(x0, y0, x1, y1, x2, y2){
        var stangle = Math.atan2(x1-x0, y1-y0);
        var endangle = Math.atan2(x1-x2, y1 - y2);
        var angle = Math.floor((Math.abs(stangle - endangle)*180/Math.PI));
        angle = angle>180?360-angle:angle;
//        ctx.strokeStyle = '#f08';
//        ctx.beginPath();
//        ctx.arc(x1, y1, 10, -stangle, -endangle, true);
//        ctx.stroke();
        ctx.fillStyle = '#f08';
        ctx.fillText(""+angle+"\xB0", x1+5, y1+10);
    }
}
