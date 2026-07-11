// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Visa Wallet Rating Pass — soulbound (ERC-5192) rating credential.
/// @notice One pass per wallet, minted by the relayer, non-transferable.
///         Metadata is fully on-chain (base64 JSON + SVG) so the card renders
///         in any wallet with no server dependency. The relayer can update
///         grade/score as the wallet re-scores — the pass "stays current".
contract VWRPass {
    string public constant name = "Visa Wallet Rating Pass";
    string public constant symbol = "VWR";

    address public owner; // relayer
    uint256 public nextId = 1;

    struct Rating {
        string grade; // "A+", "B", ...
        uint16 score; // 0..1000
    }

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) public tokenOf; // one pass per wallet
    mapping(uint256 => Rating) public ratingOf;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Locked(uint256 tokenId); // ERC-5192
    event RatingUpdated(uint256 indexed tokenId, string grade, uint16 score);

    modifier onlyOwner() {
        require(msg.sender == owner, "not relayer");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function mint(address to, string calldata grade, uint16 score) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "zero address");
        require(tokenOf[to] == 0, "already has a pass");
        tokenId = nextId++;
        _ownerOf[tokenId] = to;
        tokenOf[to] = tokenId;
        ratingOf[tokenId] = Rating(grade, score);
        emit Transfer(address(0), to, tokenId);
        emit Locked(tokenId);
    }

    function updateRating(uint256 tokenId, string calldata grade, uint16 score) external onlyOwner {
        require(_ownerOf[tokenId] != address(0), "no token");
        ratingOf[tokenId] = Rating(grade, score);
        emit RatingUpdated(tokenId, grade, score);
    }

    // ---- ERC-721 read surface (enough for wallets to display the pass) ----

    function balanceOf(address who) external view returns (uint256) {
        return tokenOf[who] == 0 ? 0 : 1;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address o = _ownerOf[tokenId];
        require(o != address(0), "no token");
        return o;
    }

    /// @notice ERC-5192: every token is permanently locked.
    function locked(uint256 tokenId) external view returns (bool) {
        ownerOf(tokenId);
        return true;
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 // ERC-165
            || id == 0x80ac58cd // ERC-721
            || id == 0x5b5e139f // ERC-721 Metadata
            || id == 0xb45a3c0e; // ERC-5192
    }

    // ---- Soulbound: every transfer/approval path reverts ----

    function transferFrom(address, address, uint256) external pure { revert("soulbound"); }
    function safeTransferFrom(address, address, uint256) external pure { revert("soulbound"); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure { revert("soulbound"); }
    function approve(address, uint256) external pure { revert("soulbound"); }
    function setApprovalForAll(address, bool) external pure { revert("soulbound"); }
    function getApproved(uint256) external pure returns (address) { return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }

    // ---- On-chain metadata: base64 JSON with an embedded SVG card ----

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        address holder = ownerOf(tokenId);
        Rating memory r = ratingOf[tokenId];
        string memory scoreStr = _toString(r.score);
        string memory svg = _svg(holder, r.grade, scoreStr);
        string memory json = string(
            abi.encodePacked(
                '{"name":"Visa Wallet Rating Pass \\u2014 ', r.grade, " ", scoreStr,
                '","description":"Soulbound wallet rating credential. Re-scored as the wallet transacts; non-transferable.",',
                '"attributes":[{"trait_type":"Grade","value":"', r.grade,
                '"},{"trait_type":"Score","max_value":1000,"value":', scoreStr,
                '}],"image":"data:image/svg+xml;base64,', _b64(bytes(svg)), '"}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", _b64(bytes(json))));
    }

    function _svg(address holder, string memory grade, string memory scoreStr) internal pure returns (string memory) {
        bytes1 band = bytes(grade)[0];
        // Gold face for A, black for F (never minted), Visa blue otherwise.
        (string memory c1, string memory c2, string memory gc) = band == "A"
            ? ("#d9b04c", "#8a641a", "#ffffff")
            : ("#2247e8", "#0c2189", band == "B" ? "#FFC24B" : "#FF8A7A");
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="378" viewBox="0 0 600 378">',
                '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
                '<stop offset="0" stop-color="', c1, '"/><stop offset="1" stop-color="', c2, '"/></linearGradient></defs>',
                '<rect width="600" height="378" rx="28" fill="url(#g)"/>',
                '<text x="40" y="64" font-family="Helvetica,Arial" font-size="20" letter-spacing="6" fill="rgba(255,255,255,0.8)" font-weight="600">VISA WALLET RATING</text>',
                '<text x="560" y="110" text-anchor="end" font-family="Helvetica,Arial" font-size="88" font-weight="700" fill="', gc, '">', grade, "</text>",
                '<text x="560" y="150" text-anchor="end" font-family="Helvetica,Arial" font-size="24" fill="rgba(255,255,255,0.75)">', scoreStr, " / 1000</text>",
                '<text x="40" y="290" font-family="Courier New,monospace" font-size="26" letter-spacing="3" fill="rgba(255,255,255,0.95)">', _shortAddr(holder), "</text>",
                '<text x="40" y="336" font-family="Helvetica,Arial" font-size="16" letter-spacing="4" fill="rgba(255,255,255,0.6)">SOULBOUND</text>',
                '<text x="560" y="340" text-anchor="end" font-family="Helvetica,Arial" font-size="38" font-style="italic" font-weight="800" fill="#ffffff">VISA</text>',
                "</svg>"
            )
        );
    }

    function _shortAddr(address a) internal pure returns (string memory) {
        bytes memory full = bytes(_toHexString(a));
        bytes memory out = new bytes(13);
        for (uint256 i = 0; i < 6; i++) out[i] = full[i];
        out[6] = 0xE2; out[7] = 0x80; out[8] = 0xA6; // ellipsis UTF-8
        for (uint256 i = 0; i < 4; i++) out[9 + i] = full[38 + i];
        return string(out);
    }

    function _toHexString(address a) internal pure returns (string memory) {
        bytes16 hexChars = "0123456789abcdef";
        bytes20 data = bytes20(a);
        bytes memory out = new bytes(42);
        out[0] = "0"; out[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            out[2 + i * 2] = hexChars[uint8(data[i]) >> 4];
            out[3 + i * 2] = hexChars[uint8(data[i]) & 0x0f];
        }
        return string(out);
    }

    function _toString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 t = v;
        uint256 digits;
        while (t != 0) { digits++; t /= 10; }
        bytes memory out = new bytes(digits);
        while (v != 0) { out[--digits] = bytes1(uint8(48 + (v % 10))); v /= 10; }
        return string(out);
    }

    function _b64(bytes memory data) internal pure returns (string memory) {
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        if (data.length == 0) return "";
        string memory result = new string(4 * ((data.length + 2) / 3));
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            for { let dataPtr := data let endPtr := add(data, mload(data)) } lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F)))) resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F)))) resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F)))) resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F)))) resultPtr := add(resultPtr, 1)
            }
            switch mod(mload(data), 3)
            case 1 { mstore8(sub(resultPtr, 1), 0x3d) mstore8(sub(resultPtr, 2), 0x3d) }
            case 2 { mstore8(sub(resultPtr, 1), 0x3d) }
        }
        return result;
    }
}
