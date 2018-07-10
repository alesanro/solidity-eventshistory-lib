/**
* Copyright 2017–2018, LaborX PTY
* Licensed under the AGPL Version 3 license.
*/

pragma solidity ^0.4.21;


/**
 * @title General MultiEventsHistory user.
 */
contract MultiEventsHistoryAdapter {

    address internal localEventsHistory;

    event ErrorCode(address indexed self, uint errorCode);

    function getEventsHistory() 
    public 
    view 
    returns (address) 
    {
        return localEventsHistory;
    }

    function emitErrorCode(uint _errorCode) public {
        emit ErrorCode(_self(), _errorCode);
    }

    function _setEventsHistory(address _eventsHistory) internal returns (bool) {
        localEventsHistory = _eventsHistory;
        return true;
    }

    // It is address of MultiEventsHistory caller assuming we are inside of delegate call.
    function _self() 
    internal 
    view 
    returns (address) 
    {
        return msg.sender;
    }

    function _emitErrorCode(uint _errorCode) internal returns (uint) {
        MultiEventsHistoryAdapter(getEventsHistory()).emitErrorCode(_errorCode);
        return _errorCode;
    }
}
