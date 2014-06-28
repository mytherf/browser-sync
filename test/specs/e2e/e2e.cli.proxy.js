"use strict";

var browserSync = require("../../../lib/index");

var http    = require("http");
var path    = require("path");
var connect = require("connect");
var request = require("supertest");
var assert  = require("chai").assert;
var client  = require("socket.io-client");
var fork    = require("child_process").fork;

var index   = path.resolve( __dirname + "/../../../lib/index.js");

describe("E2E CLI proxy test", function () {

    var stubServer, bs, options;

    before(function (done) {

        var testApp = connect()
            .use(connect.static(__dirname + "/../../fixtures/"));

        // server to proxy
        stubServer = http.createServer(testApp).listen(8000);

        bs = fork(index, ["start", "--proxy", "localhost:8000", "--no-open", "--logLevel=silent"]);

        bs.on("message", function (data) {
            options = data.options;
            done();
        });

        bs.send({send: "options"});
    });

    after(function () {
        bs.kill("SIGINT");
        stubServer.close();
    });

    it("can serve the script", function (done) {

        request(options.urls.local)
            .get(options.scriptPath)
            .expect(200)
            .end(function (err, res) {
                assert.isTrue(res.text.indexOf("Connected to BrowserSync") > 0);
                done();
            });
    });

    it("Can serve files", function (done) {
        request(options.urls.local)
            .get("/")
            .expect(200)
            .end(function (err, res) {
                assert.isTrue(res.text.indexOf("BrowserSync + Public URL") > 0);
                done();
            });
    });

    it("Can serve files with snippet added", function (done) {
        request(options.urls.local)
            .get("/")
            .set("accept", "text/html")
            .expect(200)
            .end(function (err, res) {
                assert.isTrue(res.text.indexOf(options.snippet) > 0);
                done();
            });
    });
});
