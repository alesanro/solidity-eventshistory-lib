pragma solidity ^0.4.11;

contract FakeEventsEmitter {
    event Event1(bytes32 payload);
    event Event2(bytes32 payload);
    event Event3(bytes32 payload);

    function emitEvent1(bytes32 payload) {
        Event1(payload);
    }

    function emitEvent2(bytes32 payload) {
        Event2(payload);
    }

    function emitEvent3(bytes32 payload) {
        Event3(payload);
    }
}
