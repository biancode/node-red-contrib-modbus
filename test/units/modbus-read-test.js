/**
 * Original Work Copyright 2014 IBM Corp.
 * node-red
 *
 * Copyright (c) since the year 2016 Klaus Landsdorf (http://plus4nodered.com/)
 * All rights reserved.
 * node-red-contrib-modbus - The BSD 3-Clause License
 *
 **/

'use strict'

const clientNode = require('../../src/modbus-client.js')
const serverNode = require('../../src/modbus-server.js')
const readNode = require('../../src/modbus-read.js')
const ioConfigNode = require('../../src/modbus-io-config')

const testReadNodes = [clientNode, serverNode, readNode, ioConfigNode]

const helper = require('node-red-node-test-helper')
helper.init(require.resolve('node-red'))

const testFlows = require('./flows/modbus-read-flows')
const mBasics = require('../../src/modbus-basics')

describe('Read node Testing', function () {
  before(function (done) {
    helper.startServer(function () {
      done()
    })
  })

  afterEach(function (done) {
    helper.unload().then(function () {
      done()
    }).catch(function () {
      done()
    })
  })

  after(function (done) {
    helper.stopServer(function () {
      done()
    })
  })

  describe('Node', function () {
    it('simple Node should be loaded without client config', function (done) {
      helper.load(testReadNodes, testFlows.testReadWithoutClientFlow, function () {
        const modbusRead = helper.getNode('8ecaae3e.4b8928')
        modbusRead.should.have.property('name', 'modbusRead')
        done()
      }, function () {
        helper.log('function callback')
      })
    })

    it('simple Node should be loaded', function (done) {
      helper.load(testReadNodes, testFlows.testReadWithClientFlow, function () {
        const modbusServer = helper.getNode('b071294594e37a6c')
        modbusServer.should.have.property('name', 'modbusServer')

        const modbusClient = helper.getNode('9018f377f076609d')
        modbusClient.should.have.property('name', 'modbusClient')

        const modbusRead = helper.getNode('09846c74de630616')
        modbusRead.should.have.property('name', 'modbusRead')

        done()
      }, function () {
        helper.log('function callback')
      })
    })

    it('simple Node should send message with empty topic', function (done) {
      helper.load(testReadNodes, testFlows.testReadMsgFlow, function () {
        const h1 = helper.getNode('h1')
        let counter = 0
        h1.on('input', function (msg) {
          counter++
          if (counter === 1 && msg.topic === 'polling') {
            done()
          }
        })
      }, function () {
        helper.log('function callback')
      })
    })

    it('simple Node should send message with own topic', function (done) {
      helper.load(testReadNodes, testFlows.testReadMsgMyTopicFlow, function () {
        const h1 = helper.getNode('h1')
        let counter = 0
        h1.on('input', function (msg) {
          counter++
          if (counter === 1 && msg.topic === 'myTopic') {
            done()
          }
        })
      }, function () {
        helper.log('function callback')
      })
    })

    it('simple Node should send message with IO', function (done) {
      helper.load(testReadNodes, testFlows.testReadWithClientIoFlow, function () {
        const h1 = helper.getNode('h1')
        let countMsg = 0
        h1.on('input', function (msg) {
          countMsg++
          if (countMsg === 4) {
            done()
          }
        })
      }, function () {
        helper.log('function callback')
      })
    })

    it('simple Node should send message with IO and sending IO-objects as payload', function (done) {
      helper.load(testReadNodes, testFlows.testReadWithClientIoPayloadFlow, function () {
        const h1 = helper.getNode('h1')
        let countMsg = 0
        h1.on('input', function (msg) {
          countMsg++
          if (countMsg === 4) {
            done()
          }
        })
      }, function () {
        helper.log('function callback')
      })
    })

    it('should be state queueing - ready to send', function (done) {
      helper.load(testReadNodes, testFlows.testReadMsgFlow, function () {
        const modbusClientNode = helper.getNode('92e7bf63.2efd7')
        setTimeout(() => {
          mBasics.setNodeStatusTo('queueing', modbusClientNode)
          let isReady = modbusClientNode.isReadyToSend(modbusClientNode)
          isReady.should.be.true
          done()
        } , 1500)
      })
    })

    it('should be not state queueing - not ready to send', function (done) {
      helper.load(testReadNodes, testFlows.testReadMsgFlow, function () {
        const modbusClientNode = helper.getNode('92e7bf63.2efd7')
        setTimeout(() => {
          mBasics.setNodeStatusTo('stopped', modbusClientNode)
          let isReady = modbusClientNode.isReadyToSend(modbusClientNode)
          isReady.should.be.false
          done()
        } , 1500)
      })
    })

    it('the read node should log a warning when it receives an error with onModbusError', function(done) {
      helper.load(testReadNodes, testFlows.testReadWithClientFlow, function () {
        const readNode = helper.getNode('09846c74de630616')
        readNode.showErrors = true;
        let mock_message = "";
        readNode.warn = function(message) { mock_message = message; }

        readNode.onModbusError("Failure test message!")
        mock_message.should.equal("Failure test message!")
        done()
      })
    })
    it('the read node can log with node.warn when node.verboseLogging and node.showErrors are true', function(done) {
      helper.load(testReadNodes, testFlows.testReadWithClientFlow, function () {
        const readNode = helper.getNode('09846c74de630616')
        readNode.verboseLogging = true
        readNode.showErrors = true
        let mock_message = ""
        readNode.warn = function(message) { mock_message = message }

        readNode.onModbusError("Failure test message!")
        mock_message.should.equal("Failure test message!")
        done()
      })
    })

    it('onModbusReadError should call errorProtcolMessage and log a message when node.showError is true', function(done) {
      helper.load(testReadNodes, testFlows.testReadWithClientFlow, function () {
        const readNode = helper.getNode('09846c74de630616')
        readNode.verboseLogging = true
        readNode.showErrors = true
        let mock_message_output = "";
        readNode.errorProtocolMsg = function(err, msg) {
          if(readNode.showErrors) {
            mock_message_output = msg
          }
        }

        readNode.onModbusReadError({}, "This should be logged in our mock errorProtocol")
        mock_message_output.should.equal("This should be logged in our mock errorProtocol")
        done()
      })
    })

    it('verbosewarn should log a message when the verbosity level and showWarnings are enabled', function(done) {
      helper.load(testReadNodes, testFlows.testReadWithClientFlow, function () {
        const readNode = helper.getNode('09846c74de630616')

        readNode.verboseLogging = true
        readNode.showWarnings = true
        readNode.delayTimerReading = true;

        let mock_message_output = "";
        readNode.warn = function(message) { mock_message_output = message }

        readNode.resetDelayTimerToRead(readNode);
        mock_message_output.should.equal("Read -> resetDelayTimerToRead node 09846c74de630616 address: 0")
        done()
      })
    })
  })

  describe('post', function () {
    it('should fail for invalid node', function (done) {
      helper.request().post('/modbus-read/invalid').expect(404).end(done)
    })

    it('should fail for unloaded node', function (done) {
      helper.request().post('/modbus/read/inject/8ecaae3e.4b8928').expect(404).end(done)
    })

    it('should inject on valid node', function (done) {
      helper.load([clientNode, serverNode, readNode], testFlows.testReadWithClientFlow, function () {
        helper.request().post('/modbus/read/inject/09846c74de630616').expect(200).end(done)
      }, function () {
        helper.log('function callback')
      })
    })
  })
})
