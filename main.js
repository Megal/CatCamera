//define classes for GPC
var PolyDefault = gpcas.geometry.PolyDefault ;
var ArrayList = gpcas.util.ArrayList;
var PolySimple = gpcas.geometry.PolySimple;
var Clip = gpcas.geometry.Clip;
var OperationType = gpcas.geometry.OperationType;
var LmtTable = gpcas.geometry.LmtTable;
var ScanBeamTreeEntries = gpcas.geometry.ScanBeamTreeEntries;
var EdgeTable = gpcas.geometry.EdgeTable;
var EdgeNode = gpcas.geometry.EdgeNode;
var ScanBeamTree = gpcas.geometry.ScanBeamTree;
var Rectangle = gpcas.geometry.Rectangle;
var BundleState = gpcas.geometry.BundleState;
var LmtNode = gpcas.geometry.LmtNode;
var TopPolygonNode = gpcas.geometry.TopPolygonNode;
var AetTree = gpcas.geometry.AetTree;
var HState = gpcas.geometry.HState;
var VertexType = gpcas.geometry.VertexType;
var VertexNode = gpcas.geometry.VertexNode;
var PolygonNode = gpcas.geometry.PolygonNode;
var ItNodeTable = gpcas.geometry.ItNodeTable;
var StNode = gpcas.geometry.StNode;
var ItNode = gpcas.geometry.ItNode;
////


var difference = function(poly1, poly2) {
	clearScreen();
	drawPoly(poly1,"blue",0,-30);
	drawPoly(poly2,"red",0,-30);
		
	var diff = poly1.difference(poly2);
	drawPoly(diff,"green",0,150);
	
}
var intersection = function(poly1, poly2) {
	clearScreen();
	
	drawPoly(poly1,"blue",0,-30);
	drawPoly(poly2,"red",0,-30);
		
	var diff = poly1.intersection(poly2);
	drawPoly(diff,"green",0,150);
}
var union = function(poly1, poly2) {
	clearScreen();
	
	drawPoly(poly1,"blue",0,-30);
	drawPoly(poly2,"red",0,-30);
		
	var diff = poly1.union(poly2);
	drawPoly(diff,"green",0,150);
}
var xor = function(poly1, poly2) {
	clearScreen();
	
	drawPoly(poly1,"blue",0,-30);
	drawPoly(poly2,"red",0,-30);
		
	var diff = poly1.xor	(poly2);
	drawPoly(diff,"green",0,150);
}
var createPoly = function(points) {
    var res  = new PolyDefault();
    for(var i=0 ; i < points.length ; i++) {    
        res.addPoint(new Point(points[i][0],points[i][1]));
    }
    return res;
}
var getPolygonVertices = function(poly) {
	var vertices=[];
	var numPoints = poly.getNumPoints();
	var i;
	
	for(i=0;i<numPoints;i++) {
		vertices.push([poly.getX(i) , poly.getY(i)]);
	}
	return vertices;
}
var drawPoly = function(polygon,strokeColor,ox,oy) {
	var num = polygon.getNumInnerPoly();
	var i;
	
	//if more than one poly produced, use multiple color to display
	var colors=["#91ab19","#ab9119","#e5ce35","#ab1998"];
	
	for(i=0;i<num;i++) {
		var poly = polygon.getInnerPoly(i);
		var vertices  = getPolygonVertices(poly);

		if(i==0)	drawSinglePoly(vertices,strokeColor,poly.isHole(),ox,oy);
		else 	drawSinglePoly(vertices,colors[i%num],poly.isHole(),ox,oy);
		
	}
	
	
}
var drawSinglePoly = function(vertices,strokeColor,hole,ox,oy) {
	var i;
	
	if(ox==undefined)	ox = 0;
	if(oy==undefined)	oy = 0;
	
	context.beginPath();
   context.moveTo(vertices[0][0]+ox, vertices[0][1]+oy);
   
	for(i=1;i<vertices.length;i++) {
		context.lineTo(vertices[i][0]+ox, vertices[i][1]+oy);	
	}
	
	
	context.lineWidth = 2;
	context.strokeStyle = strokeColor;
	context.fillStyle = "rgba(255, 0, 0, 0.1)";
	
	if(hole==true) {
		context.fillStyle = "#ffffff";
	}
   context.closePath();
	context.stroke();
	context.fill();
}
var clearScreen = function() {
	context.clearRect (0,0,500,500);
}