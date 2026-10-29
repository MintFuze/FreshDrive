import{readFile,writeFile}from'node:fs/promises';
let s=await readFile('dist/app.js','utf8');
s=s.replace("$('#stops').append(el);el.querySelector('button')", "if(l.coords)el.dataset.coords=l.coords;$('#stops').append(el);el.querySelector('button')");
s=s.replace("<button class=\"quiet danger\" data-action=\"delete-route\"", "<button class=\"quiet\" data-action=\"map\" data-id=\"${esc(r.id)}\">Карта ⌖</button><button class=\"quiet danger\" data-action=\"delete-route\"");
s=s.replace("if(a==='trip')tripForm(i);", "if(a==='map')showMap(i);if(a==='trip')tripForm(i);");
s=s.replace("import{totalKm", "import{attachCoordinates,showRouteMap}from './maps.js';\nimport{totalKm");
s=s.replace("function setupRoute(r){", "function setupRoute(r){attachCoordinates();");
s+="\nfunction showMap(routeId){const r=data.routes.find(r=>r.id===routeId);showRouteMap(r,modal,esc)}\n";
await writeFile('dist/app.js',s);
