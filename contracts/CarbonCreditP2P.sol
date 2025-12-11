// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICarbonCredit {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract CarbonCreditP2P {
    struct Offer {
        uint256 id;
        address seller;
        uint256 amount; 
        uint256 pricePerCredit; 
        bool active;
    }

    uint256 public nextOfferId;
    mapping(uint256 => Offer) public offers;

    ICarbonCredit public carbonToken;

    event OfferCreated(uint256 indexed id, address indexed seller, uint256 amount, uint256 pricePerCredit);
    event OfferAccepted(uint256 indexed id, address indexed buyer, uint256 totalPrice);
    event OfferCancelled(uint256 indexed id, address indexed seller);

    constructor(address _carbonToken) {
        carbonToken = ICarbonCredit(_carbonToken);
    }

    function createOffer(uint256 amount, uint256 pricePerCredit) external {
        require(amount > 0, "Amount must be > 0");
        require(pricePerCredit > 0, "Price must be > 0");

        uint8 dec = carbonToken.decimals();
        uint256 amtWei = amount * (10 ** dec);

        require(carbonToken.transferFrom(msg.sender, address(this), amtWei), "Transfer failed");

        offers[nextOfferId] = Offer({
            id: nextOfferId,
            seller: msg.sender,
            amount: amount, 
            pricePerCredit: pricePerCredit,
            active: true
        });

        emit OfferCreated(nextOfferId, msg.sender, amount, pricePerCredit);
        nextOfferId++;
    }

    function acceptOffer(uint256 offerId) external payable {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");

        uint256 totalPrice = offer.amount * offer.pricePerCredit;
        require(msg.value == totalPrice, "Incorrect payment");

       
        payable(offer.seller).transfer(msg.value);

        uint8 dec = carbonToken.decimals();
        uint256 amtWei = offer.amount * (10 ** dec);

    
        require(carbonToken.transfer(msg.sender, amtWei), "Credit transfer failed");

        offer.active = false;
        emit OfferAccepted(offerId, msg.sender, totalPrice);
    }

    function cancelOffer(uint256 offerId) external {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");
        require(offer.seller == msg.sender, "Not your offer");

        offer.active = false;

        uint8 dec = carbonToken.decimals();
        uint256 amtWei = offer.amount * (10 ** dec);

        require(carbonToken.transfer(msg.sender, amtWei), "Return transfer failed");

        emit OfferCancelled(offerId, msg.sender);
    }
}
