pragma solidity ^0.4.11;


import "../MultiEventsHistoryAdapter.sol";

contract IncorrectEmitterInterface {
    event LogAction();

    function emitAction() public;
}


contract FakeEventsEmitter is MultiEventsHistoryAdapter {
    event Event1(bytes32 payload);
    event Event2(bytes32 payload);
    event Event3(bytes32 payload);

    function emitEvent1(bytes32 payload) public {
        emit Event1(payload);
    }

    function emitEvent2(bytes32 payload) public {
        emit Event2(payload);
    }

    function emitEvent3(bytes32 payload) public {
        emit Event3(payload);
    }

    function setEventsHistory(address _eventsHistory) external returns (bool) {
        _setEventsHistory(_eventsHistory);
    }

    function invokeWithErrorCode() external {
        _emitErrorCode(1278);
    }

    function invokeInvalidEvent() external {
        IncorrectEmitterInterface(getEventsHistory()).emitAction();
    }
}
