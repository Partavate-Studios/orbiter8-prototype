pragma solidity >=0.5.0 <0.6.0;

library HelperLibrary {

    struct Helper {
        uint helperNonce;
    }

    //TODO: look for other random number generation options
    function getRandom(Helper memory help) internal view returns(uint) {
        help.helperNonce += 1;
        return uint(
            keccak256(
                abi.encodePacked(
                    help.helperNonce,
                    msg.sender,
                    blockhash(block.number - 1)
                )
            )
        );
    }

}