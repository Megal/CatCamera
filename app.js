'@import visibility-polygon-js/visibility_polygon_dev.js';

let VisibilityPolygon = require('./visibility-polygon-js/visibility_polygon_dev');
let inner = require('./geo')
let outer = require('./geo2')
let camPoly=[];

const express = require('express')
const greiner = require('greiner-hormann')
const path = require('path')
const app = express()
const port = 3000

let center = [
	38.9178872108,
	47.2184894537
]

let rPolyCam = 0.000466366;
let edgeNumCam = 8;



let innerData = inner.data.features.map(function(feature) { return feature.geometry.coordinates[0] });
let outerData = outer.data.features.map(function(feature) { return feature.geometry.coordinates[0] });
let geodata = innerData.concat(outerData)

let allCorners = innerData.reduce(
		(total, currentValue) => {
			currentValue.forEach(corner => { 
				total.push(corner) 
			})

			return total
		}, 
		[]
	)
//console.log('allCorners\n', allCorners, '\n/allCorners')

function bestPlacement(cameraCount) {

	let attempts = 10
	let bestResult = []
	let bestArea = -1

	for (let attempt = 0; attempt < attempts; ++attempt) {
		let placement = shuffle(allCorners).slice(0, cameraCount);
		// console.log('placement', placement);

		let totalVisibility = []
		placement.forEach(function(vertex) {
			// console.log('vertex', vertex);
			let visibilityPolygon = makeVisibility(vertex);
			// console.log('visibilityPolygon = ', visibilityPolygon);

			if (totalVisibility.length > 0) {
				totalVisibility = mergePoly(totalVisibility, visibilityPolygon);
			}
			else {
				totalVisibility = visibilityPolygon;
			}
			// console.log('totalVisibility = ', totalVisibility);
		});

		let area = calcTotalArea(totalVisibility)
		// console.log('area = ', area);
		if (bestArea < area) {
			bestArea = area;
			bestResult = placement;
			console.log('new best area = ', bestArea);
	}

	}

	return bestResult
}

function calcTotalArea(polygons) {
	let vectorizedArea = 0

	if(typeof polygons[0][0] === 'number'){ // single linear ring
        polygons = [polygons];
	}
	
    for(var i = 0, len = polygons.length; i < len; ++i){
		let onePoly = polygons[i]
		// console.log('one poly', onePoly)

		let vectorized = onePoly.map(a => ({x: a[0], y: a[1]}));
		// console.log('vectorized', vectorized)

		vectorizedArea += calcPolygonArea(vectorized);
		// console.log('vectorizedArea', vectorizedArea)
	}
	
	return vectorizedArea
}

function makeVisibility(vertex) {
	let x = vertex[0]
	let y = vertex[1]

	// make Umbrella
	let umbrella = calcPolyCam(x, y, rPolyCam, edgeNumCam);	

	// place Umbrella
	let geodataRestricted = geodata.slice();
	geodataRestricted.push(umbrella);

	// convert to segments
	let segments = VisibilityPolygon.convertToSegments(geodataRestricted);
	segments = VisibilityPolygon.breakIntersections(segments);

	// draw polygon and filter
	let visibility = VisibilityPolygon.compute(vertex, segments);
	let viewportVisibility = VisibilityPolygon.computeViewport(vertex, segments, [38.90911102294922, 38.926663398742676], [47.21408806123239, 47.22289084617913]);
	let filtered = viewportVisibility.filter(e => e.length == 2)

	return filtered
}

function geojsonfy(polygon) {
	let duplicatedFirst = polygon
	duplicatedFirst.push(polygon[0])

	return {
		"type": "FeatureCollection",
		"features": [
			{
				"type": "Feature",
				"properties": {},
				"geometry": {
					"type": "Polygon",
					"coordinates": [ duplicatedFirst ]
				}
			}
		]
	}
}

function calcPolyCam(x, y, radius, numberOfSegments) {

	// make super precision using magic constant of Math Math.SQRT1_2
    let coordinates=[];

    for (let i = 0; i <= numberOfSegments; i += 1) {
        coordinates.push([x + radius * Math.cos(i * 2 * Math.PI / numberOfSegments), y + radius * Math.sin(i * 2 * Math.PI / numberOfSegments)]);
    }
    return coordinates;
}


function calcPolygonArea(vertices) {
	let total = 0;

	for (let i = 0, l = vertices.length; i < l; i++) {
		let addX = vertices[i].x;
		let addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
		let subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
		let subY = vertices[i].y;

		total += (addX * addY * 0.5);
		total -= (subX * subY * 0.5);
	}

	return Math.abs(total);
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function mergePoly(source, simple) {
	if (source.length == 0) {
		return [simple]
	}

	let final = []
	for (let i = 0, len = source.count; i < len; ++i) {
		let one = source[i]
		let merged = greiner.union(one,simple)
		if (merged.length == 2) {
			final.push(one)
			// console.log('skipping ', one)
		}
		else {
			simple = merged[0]
			// console.log('merged ', simple)
		}
	}

	final.push(simple)
	// console.log('finalizing: ', final)
	return final
}

function mymerge()
{
	console.log("merge = ",mergePoly(calcPolyCam(2, 2, 2, 4),calcPolyCam(1, 1, 2, 4)))
	return mergePoly(calcPolyCam(1, 1, 1, 4),calcPolyCam(2, 2, 2, 4))
}



let init = function() {
	let canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");
	
	console.log(polygons);
	let outer = createPoly(polygons[0]);
	let first = createPoly(polygons[1]);
	let second = createPoly(polygons[2]);
	console.log(first);
	console.log(second);

	let triangles = one.union(two);

	let paths = triangles.map(triangle => {
		return triangle.reduce((p, pt) => {
		return p.concat(pt.map(p => p));
		}, []);
	});
  
	clearScreen();

	let combined =  createPoly(paths);

	console.log(combined);
	//bring to screen
	drawPoly(outer,"blue",0,0);
	// drawPoly(first,"red",0,0);
	// drawPoly(second,"cyan",0,0);
	drawPoly(combined,"green",0,0);
}

//mymerge()

// Express
app.get('/',function(req,res) {
	res.sendFile('test.html', {root: path.join(__dirname, './')});
});

app.get('/result',function(req,res) {
	res.send(geojsonfy(viewportVisibility));
});

app.get('/best', function(req,res) {
	if (req.query.count != null) {
		res.send(bestPlacement(req.query.count));

	} else {
		res.send(bestPlacement(10));

	}
});

// app.get('/merge', function(req,res) {
// 	res.send(geojsonfy(mymerge()));
// });



app.listen(port, () => console.log(`App listening on port ${port}!`))