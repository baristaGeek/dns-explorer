export class DNSMessageHeader {
    private id: number;                    // 16 bits
    private qr: number;                    // 1 bit
    private opcode: number;                // 4 bits
    private aa: number;                    // 1 bit
    private tc: number;                    // 1 bit
    private rd: number;                    // 1 bit
    private ra: number;                    // 1 bit
    private z: number;                     // 3 bits
    private rcode: number;                 // 4 bits
    private qdcount: number;               // 16 bits
    private ancount: number;               // 16 bits
    private nscount: number;               // 16 bits
    private arcount: number;               // 16 bits

    constructor() {
        this.id = 1234;                    // Expected test value
        this.qr = 1;                       // Response packet
        this.opcode = 0;                   // Needs to be set programmatically
        this.aa = 0;                       // Not authoritative
        this.tc = 0;                       // Not truncated
        this.rd = 1;                       // Recursion IS desired
        this.ra = 0;                       // Recursion not available
        this.z = 0;                        // Reserved bits
        this.rcode = 0;                    // No error
        this.qdcount = 0;                  // No questions
        this.ancount = 0;                  // No answers
        this.nscount = 0;                  // No authority records
        this.arcount = 0;                  // No additional records
    }

    public toBuffer(): Buffer {
        const buffer = Buffer.alloc(12);   // Header is always 12 bytes

        // Write ID (16 bits)
        buffer.writeUInt16BE(this.id, 0);

        // Combine flags into two bytes
        const flags = (this.qr << 15) |    // QR is highest bit of first byte
                     (this.opcode << 11) |  // OPCODE is next 4 bits
                     (this.aa << 10) |      // AA is next bit
                     (this.tc << 9) |       // TC is next bit
                     (this.rd << 8) |       // RD is last bit of first byte
                     (this.ra << 7) |       // RA is highest bit of second byte
                     (this.z << 4) |        // Z is next 3 bits
                     this.rcode;            // RCODE is last 4 bits

        buffer.writeUInt16BE(flags, 2);

        // Write counts (16 bits each)
        buffer.writeUInt16BE(this.qdcount, 4);
        buffer.writeUInt16BE(this.ancount, 6);
        buffer.writeUInt16BE(this.nscount, 8);
        buffer.writeUInt16BE(this.arcount, 10);

        return buffer;
    }

    // public toBuffer(): Buffer {
    //     const buffer = Buffer.alloc(12);

    //     buffer.writeUInt16BE(this.id, 0);

    //     const flags = (this.qr << 15) |
    //                  (this.opcode << 11) |
    //                  (this.aa << 10) |
    //                  (this.tc << 9) |
    //                  (this.rd << 8) |
    //                  (this.ra << 7) |
    //                  (this.z << 4) |
    //                  this.rcode;

    //     buffer.writeUInt16BE(flags, 2);
    //     buffer.writeUInt16BE(this.qdcount, 4);
    //     buffer.writeUInt16BE(this.ancount, 6);
    //     buffer.writeUInt16BE(this.nscount, 8);
    //     buffer.writeUInt16BE(this.arcount, 10);

    //     return buffer;
    // }


    public setId(id: number) {
        this.id = id;
    }

    public setQDCount(count: number) {
        this.qdcount = count;
    }

    public setANCount(count: number) {
        this.ancount = count;
    }

    public setOpcode(opcode: number) {
        this.opcode = opcode;
    }

    public setRCode(opcode: number) {
        this.rcode = opcode === 0 ? 0 : 4;
    }

    public setRD(rd: number) {
        this.rd = rd;
    }
    
    public setQR(value: number) {
        this.qr = value;
    }
    
}

// export class DNSMessageHeader {
//     packetID: number = 0;
//     isResponse: boolean = false;
//     opCode: number = 0;
//     isAuthoritativeAnswer: boolean = false;
//     isTruncated: boolean = false;
//     isRecursionDesired: boolean = false;
//     isRecursionAvailable: boolean = false;
//     responseCode: number = 0;
//     questionCount: number = 0;
//     answerRecordCount: number = 0;
//     authorityRecordCount: number = 0;
//     additionalRecordCount: number = 0;
//     encode(): Uint8Array {
//       const byteArray = new Uint8Array(12);
//       // packetID
//       let lowByte = this.packetID & 0xff;
//       let highByte = (this.packetID >> 8) & 0xff;
//       byteArray[0] = highByte;
//       byteArray[1] = lowByte;
//       // QR, OPCODE, AA, TC, RD
//       let byte = 0;
//       if (this.isResponse) byte |= 0b10000000;
//       byte |= this.opCode << 3;
//       if (this.isAuthoritativeAnswer) byte |= 0b00000100;
//       if (this.isTruncated) byte |= 0b00000010;
//       if (this.isRecursionDesired) byte |= 0b00000001;
//       byteArray[2] = byte;
//       // RA, Z, RCODE
//       byte = 0;
//       if (this.isRecursionAvailable) byte | 0b10000000;
//       // Reserved always 0
//       byte |= this.responseCode;
//       byteArray[3] = byte;
//       // QDCOUNT
//       lowByte = this.questionCount & 0xff;
//       highByte = (this.questionCount >> 8) & 0xff;
//       byteArray[4] = highByte;
//       byteArray[5] = lowByte;
//       // ANCOUNT
//       lowByte = this.answerRecordCount & 0xff;
//       highByte = (this.answerRecordCount >> 8) & 0xff;
//       byteArray[6] = highByte;
//       byteArray[7] = lowByte;
//       // NSCOUNT
//       lowByte = this.authorityRecordCount & 0xff;
//       highByte = (this.authorityRecordCount >> 8) & 0xff;
//       byteArray[8] = highByte;
//       byteArray[9] = lowByte;
//       // ARCOUNT
//       lowByte = this.additionalRecordCount & 0xff;
//       highByte = (this.additionalRecordCount >> 8) & 0xff;
//       byteArray[10] = highByte;
//       byteArray[11] = lowByte;
//       return byteArray;
//     }
//   }