pragma solidity ^0.4.8;

import "../AbstractMultiEventsHistory.sol";
import "solidity-shared-lib/contracts/Object.sol";

contract MultiEventsHistoryStub is Object, AbstractMultiEventsHistory  {

    modifier auth() {
        if (contractOwner == msg.sender) {
            _;
        }
    }
}
