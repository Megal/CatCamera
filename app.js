'@import visibility-polygon-js/visibility_polygon_dev.js';

let VisibilityPolygon = require('./visibility-polygon-js/visibility_polygon_dev');
let campos = require('./geo_campos')
let inner = require('./geo')
let outer = require('./geo2')
var fs = require('fs');
var turf = require('turf');


const express = require('express')
const greiner = require('greiner-hormann')
const path = require('path')
const app = express()
const port = 3000

let camPoly=[];

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

// allCorners = [
// 	[
// 		38.919206857681274,
// 		47.21869367405565
// 	]
// ]

allCorners = campos.data.features.map(function(feature) { return feature.geometry.coordinates });
// console.log('allCorners', allCorners)

let precalculatedVisibilities = allCorners.map(function(vertex) {
	let visibility = makeVisibility(vertex);

	console.log('visibility count ', visibility.length);
	return visibility;
});
// console.log('precalculatedVisibilities ', precalculatedVisibilities);

let vertexIndicies = Array.apply(null, {length: allCorners.length}).map(Number.call, Number)

//console.log('allCorners\n', allCorners, '\n/allCorners')

function bestPlacement(cameraCount) {

	let attempts = 10
	let bestResultIndicies = []
	let bestArea = -1
	let bestTotalVisibility = []

	for (let attempt = 0; attempt < attempts; ++attempt) {
		let placementIndicies = shuffle(vertexIndicies).slice(0, cameraCount);
		// console.log('placement', placement);

		let totalVisibility = []
		placementIndicies.forEach(function(index) {
			let vertex = allCorners[index];

			let visibilityPolygon =  precalculatedVisibilities[index];
			console.log('visibilityPolygon', visibilityPolygon);

			if (totalVisibility.length > 0) {
				totalVisibility = mergePoly(totalVisibility, visibilityPolygon);
			}
			else {
				totalVisibility = [visibilityPolygon];
			}
			// console.log('totalVisibility = ', totalVisibility);
		});

		let area = calcTotalArea(totalVisibility)
		// console.log('area = ', area);
		if (bestArea < area) {
			bestArea = area;
			bestResultIndicies = placementIndicies;
			bestTotalVisibility = totalVisibility
			console.log('new best area = ', bestArea);
		}
	}

	let placement = bestResultIndicies.map(i => allCorners[i])

	// logging best geojson

	let visibilityPolygon =  bestResultIndicies.map(i => precalculatedVisibilities[i]);
	logTotalVisibilityPolygon(visibilityPolygon);

	console.log('new best area = ', bestArea);
	return placement
}

function logTotalVisibilityPolygon(totalVisibilityPolygon) {
	console.log('logTotalVisibilityPolygon.length = ', totalVisibilityPolygon.length)
	console.log('logTotalVisibilityPolygon = ', totalVisibilityPolygon)
	let geojson = geojsonfy(totalVisibilityPolygon)
	console.log('geojson = ', geojson)
	fs.writeFile('geojson.geojson', JSON.stringify(geojson), 'utf8', function(err) {
		if (err) throw err;
		console.log('complete writing');
	});
}


function calcTotalArea(polygons) {
	let vectorizedArea = 0

	if(typeof polygons[0][0] === 'number') { // single linear ring
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
	let umbrella = precisePolCam8(x, y, rPolyCam);

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
	console.log('polygon ', polygon)
	let duplicatedFirst = polygon.map(function(building) {
		var duplicatedFirst = building.slice()
		duplicatedFirst.push(building[0])
		console.log('building[0] ', building[0])
		console.log('duplicatedFirst', duplicatedFirst)

		return duplicatedFirst
	});
	console.log('duplicatedFirst ', duplicatedFirst)

	return {
		"type": "FeatureCollection",
		"features": [
			{
				"type": "Feature",
				"properties": {},
				"geometry": {
					"type": "Polygon",
					"coordinates": duplicatedFirst
				}
			}
		]
	}
}

function precisePolCam8(x, y, R)
{
    let coordinates = [];
    coordinates[0] = [0, 1];
    coordinates[1] = [Math.SQRT1_2, Math.SQRT1_2];
    coordinates[2] = [1, 0];
    coordinates[3] = [Math.SQRT1_2, -Math.SQRT1_2];
    coordinates[4] = [0, -1];
    coordinates[5] = [-Math.SQRT1_2, -Math.SQRT1_2];
    coordinates[6] = [-1, 0];
    coordinates[7] = [-Math.SQRT1_2, Math.SQRT1_2];
    coordinates[8] = [0, 1];

    for (let i = 0; i < 9; i += 1)
    {
        coordinates[i][0] *= R;
        coordinates[i][0] += x;

        coordinates[i][1] *= R;
        coordinates[i][1] += y;
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

function geofy(poly) {
	
}

function enclose(shape) {
	let newShape = shape.slice()
	newShape.push(shape[0])

	return newShape
}

function mergePoly(source, simple) {
	if (source.length == 0) {
		return [simple]
	}

	let final = []
	for (let i = 0, len = source.length; i < len; ++i) {
		let one = source[i]

		let p_one = turf.polygon([enclose(one)])
		// console.log('p_one', p_one)

		let p_simple = turf.polygon([enclose(simple)])
		// console.log('p_simple', p_simple)			

		let merged = turf.union(p_one, p_simple)
		// console.log('merged turf', merged)			

		// console.log('merged.geometry.type', merged.geometry.type)
		if (merged.geometry.type == 'MultiPolygon') {
			final.push(one)
			console.log('skipping ', one);	
		}
		else {
			let coords = merged.geometry.coordinates;
			// console.log('coords', coords);

			simple = coords[0];
			simple.pop()
			// console.log('merged ', simple)
		}
	}

	final.push(simple)
	console.log('finalizing: ', final)
	return final
}

// function mergePoly(source, simple) {
// 	if (source.length == 0) {
// 		return [simple]
// 	}

// 	let final = []
// 	for (let i = 0, len = source.length; i < len; ++i) {
// 		let one = source[i]
// 		let merged = greiner.union(one,simple)
// 		if (merged.length == 2) {
// 			final.push(one)
// 			console.log('skipping ', one)
// 		}
// 		else {
// 			simple = merged[0]
// 			console.log('merged ', simple)
// 		}
// 	}

// 	final.push(simple)
// 	console.log('finalizing: ', final)
// 	return final
// }

function mymerge()
{
	console.log("merge = ",mergePoly(calcPolyCam(2, 2, 2, 4),calcPolyCam(1, 1, 2, 4)))
	return mergePoly(calcPolyCam(1, 1, 1, 4),calcPolyCam(2, 2, 2, x4))
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

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

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

app.listen(port, () => console.log(`App listening on port ${port}!`))
