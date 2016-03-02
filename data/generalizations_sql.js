// Converts yaml to sql

var yaml = require('js-yaml');
var fs   = require('fs');
var pg   = require('pg'); 
var async = require('async');

var default_schema = null;
var database_url = null;
var pg_type = 'MATERIALIZED VIEW';
var threads = 1;

process.argv.forEach(function (val, index, array) {
  if (index == 2) database_url = val;
  if (index == 3) threads = parseInt(val);
});

if (process.argv.length < 2) {
  console.log("arguments [DATABASE_URL] [PARALLEL_THREADS]");
  process.exit();
}

function tname(table_name) {
  return table_name;
}


if (process.argv.length == 2) {
  // Write SQL to STDOUT
  var doc = yaml.safeLoad(fs.readFileSync('generalizations.yml', 'utf8'));
  console.log("SET client_min_messages TO WARNING;");
  console.log("SET statement_timeout = 0;\n")
  doc.forEach(function(view) {
    console.log("DROP "+pg_type+" IF EXISTS " + tname(view.name) + " CASCADE;");
    console.log("CREATE "+pg_type+" " + tname(view.name) + " AS" +
                " SELECT id, " + view.select +
                " FROM "  + tname(view.from) + 
                " WHERE " + view.where + 
                " ORDER BY ST_GeoHash(ST_Transform(ST_SetSRID(Box2D(" + view.cluster_on + "), 3857), 4326));");
    console.log("CREATE INDEX " + view.name + "_" + view.index_by + "_gist ON " + 
                 tname(view.name) + " USING gist(" + view.index_by + ");");
    console.log("CREATE UNIQUE INDEX ON " + tname(view.name) + " (id);");
    console.log("ANALYZE " + tname(view.name) + ";\n");
  });
  console.log("RESET client_min_messages;");
}

function queryFunction(sql) {
  return function(callback) {
    pg.connect(database_url, function(err,client,done) {
      if(err) {
        console.error('error fetching client from pool', err);
        callback(err);
      }
      console.log("Issuing query " + sql);
      console.time('query');
      client.query(sql, function(err, result) {
        //call `done()` to release the client back to the pool
        done();
          console.timeEnd('query');

        if(err) {
          console.error('error running query', err);
          callback(err);
        }
        callback(null,"Success");
      });
    });
  }
}

function queriesFor(view) {
  var arr = [];
  arr.push(queryFunction("DROP "+pg_type+" IF EXISTS " + tname(view.name) + " CASCADE;"));
  arr.push(queryFunction("CREATE "+pg_type+" " + tname(view.name) + " AS" +
                " SELECT id, " + view.select +
                " FROM "  + tname(view.from) + 
                " WHERE " + view.where + 
                " ORDER BY ST_GeoHash(ST_Transform(ST_SetSRID(Box2D(" + view.cluster_on + "), 3857), 4326));"));
  arr.push(queryFunction("CREATE INDEX " + view.name + "_" + view.index_by + "_gist ON " + 
                 tname(view.name) + " USING gist(" + view.index_by + ");"));
  arr.push(queryFunction("CREATE UNIQUE INDEX ON " + tname(view.name) + " (id);"));
  arr.push(queryFunction("ANALYZE " + tname(view.name) + ";"));
  return arr;
}

if (process.argv.length == 3 || process.argv.length == 4) {
  console.log("Using database " + database_url);
  var doc = yaml.safeLoad(fs.readFileSync('generalizations.yml', 'utf8'));
  var queryFunctions = [];
  // create an array of functions to call and stuff
  queryFunctions.push(queryFunction("CREATE SCHEMA IF NOT EXISTS " + default_schema + ";"));
  doc.forEach(function(view) {
    queriesFor(view).forEach(function(q) { queryFunctions.push(q) });
  });

  async.parallelLimit(queryFunctions, threads, function(err,results) {
    if(err) console.error(err);
  });
}