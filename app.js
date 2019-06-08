'@import visibility-polygon-js/visibility_polygon_dev.js';
const VisibilityPolygon = require('./visibility-polygon-js/visibility_polygon_dev');
const geo = require('./geo')

const express = require('express')
const path = require('path')
const app = express()
const port = 3000

let center = [
	38.9178872108,
	47.2184894537
]

let geodata = geo.data.features.map(function(feature) { return feature.geometry.coordinates[0] });


console.log('geodata')
console.log(geodata[0])
console.log('/geodata')

var polygons = [];
polygons.push([[-1,-1],[501,-1],[501,501],[-1,501]]);
// polygons.push([[250,100],[300,200],[200,200]]);
// polygons.push([[220,100],[220,300],[300,200]]);


polygons.push([[0,0],[0,100],[100,100], [100, 0]]);
polygons.push([[50,50], [50,150], [150, 150], [150, 50]]);

// for (var i = 0, l = polygons.length; i < l; i++) {
// 	for (var j = 0, k = polygons[i].length; j < k; j++) {
// 		polygons[i][j] = polygons[i][j] + 1.0
// 	}	
// }
// console.log(polygons)


var segments = VisibilityPolygon.convertToSegments(geodata);
segments = VisibilityPolygon.breakIntersections(segments);
var position = center;
var visibility = VisibilityPolygon.compute(position, segments);
var viewportVisibility = VisibilityPolygon.computeViewport(position, segments, [38.90911102294922, 38.926663398742676], [47.21408806123239, 47.22289084617913]);

console.log('<viewportVisibility>', viewportVisibility)
console.log('</viewportVisibility>')

function geojsonfy(polygon) {
	return {
		"type": "FeatureCollection",
		"features": [
			{
				"type": "Feature",
				"properties": {},
				"geometry": {
					"type": "Polygon",
					"coordinates": [ polygon ]
				}
			}
		]
	}
}

console.log('<geojsonfy>', geojsonfy(viewportVisibility))
console.log('</geojsonfy>')


function calcPolygonArea(vertices) {
  var total = 0;

  for (var i = 0, l = vertices.length; i < l; i++) {
    var addX = vertices[i].x;
    var addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
    var subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
    var subY = vertices[i].y;

    total += (addX * addY * 0.5);
    total -= (subX * subY * 0.5);
  }

  return Math.abs(total);
}

console.log(viewportVisibility);

const xyArray = viewportVisibility.map(a => ({x: a[0], y: a[1]}));

console.log(calcPolygonArea(xyArray) );
// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });

// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!');
// });

var init = function() {
	var canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");
	
	console.log(polygons);
	var outer = createPoly(polygons[0]);
	var first = createPoly(polygons[1]);
	var second = createPoly(polygons[2]);
	console.log(first);
	console.log(second);

	// var arrayOfVec2 = polygons.map(a => (Vec2(a[0], a[1])))
	// console.log("arrayOfVec2")
	// console.log(arrayOfVec2);

	var one = Polygon([[0,0],[0,100],[100,100], [100, 0]]);
	var two = Polygon([[50,50], [50,150], [150, 150], [150, 50]]);
	let triangles = one.union(two);

	var paths = triangles.map(triangle => {
		return triangle.reduce((p, pt) => {
		return p.concat(pt.map(p => p));
		}, []);
	});
  

	clearScreen();

	var combined =  createPoly(paths);

	console.log(combined);
	//bring to screen
	drawPoly(outer,"blue",0,0);
	// drawPoly(first,"red",0,0);
	// drawPoly(second,"cyan",0,0);
	drawPoly(combined,"green",0,0);


	
	// let show1 = function() { difference(poly1, poly2); };
	// let show2 = function() { difference(poly1, poly2); };
	// let show3 = function() { difference(poly1, poly2); };
	// let show4 = function() { difference(poly1, poly2); };

	// //listen to buttons
	// document.getElementById("difBtn").addEventListener("click",show1);
	// document.getElementById("intBtn").addEventListener("click",show2);
	// document.getElementById("unBtn").addEventListener("click",show3);
	// document.getElementById("xorBtn").addEventListener("click",show4);
	
}

// Express
app.get('/',function(req,res) {
	res.sendFile('test.html', {root: path.join(__dirname, './')});
});

app.get('/result',function(req,res) {
	res.send(geojsonfy(viewportVisibility));
});

app.listen(port, () => console.log(`App listening on port ${port}!`))