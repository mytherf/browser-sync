"use strict";

var browserSync = require("../../../lib/index");

var http    = require("http");
var connect = require("connect");
var request = require("supertest");
var assert  = require("chai").assert;
var client  = require("socket.io-client");

describe("E2E proxy test", function () {

    var instance, stubServer;

    before(function (done) {

        var config = {
            proxy: "localhost:8000",
            debugInfo: false,
            open: false
        };

        var testApp = connect()
            .use(connect.static(__dirname + "/../../fixtures"));

        // server to proxy
        stubServer = http.createServer(testApp).listen(8000);

        instance = browserSync.init([], config, done);
    });

    after(function () {
        instance.cleanup();
        stubServer.close();
    });

    it("can init proxy & serve a page", function (done) {

        assert.isString(instance.options.snippet);
        assert.isDefined(instance.server);

        request(instance.server)
            .get("/index-large.html")
            .set("accept", "text/html")
            .expect(200)
            .end(function (err, res) {
                assert.isTrue(res.text.indexOf("browser-sync-client") > 0);
                done();
            });
    });

    it("Can proxy websockets", function(done){

        instance.io.sockets.on("connection", function (client) {
            done();
        });

        var clientSockets = client.connect(instance.options.urls.local, {"force new connection": true});

        clientSockets.emit("shane", {name:"shane"});
    });

    it("Can serve the script", function (done) {

        request(instance.server)
            .get(instance.options.scriptPath)
            .expect(200)
            .end(function (err, res) {
                assert.isTrue(res.text.indexOf("Connected to BrowserSync") > 0);
                done();
            });
    });

    it("Can serve files with snippet added", function (done) {
        request(instance.options.urls.local)
            .get("/")
            .set("accept", "text/html")
            .expect(200)
            .end(function (err, res) {
                assert.isTrue(res.text.indexOf(instance.options.snippet) > 0);
                done();
            });
    });
});
