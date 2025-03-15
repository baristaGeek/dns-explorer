import * as dgram from "dgram";
import { DNSMessageHeader } from "./dnsMessageHeader";

const args = process.argv.slice(2);
const resolverArg = args.find(arg => arg === args[1]);
const [resolverIp, resolverPortStr] = resolverArg?.split(':') ?? [];

const udpSocket = dgram.createSocket("udp4");
const forwardSocket = dgram.createSocket("udp4");

udpSocket.bind(2053, "127.0.0.1");

function parseDNSQuestion(data: Buffer, offset: number): [Buffer, number] {
    const labels = [];
    let currentOffset = offset;
    
    while (true) {
        const length = data[currentOffset];
        if (length === 0) {
            labels.push(Buffer.from([0]));
            currentOffset++;
            break;
        }
        
        if ((length & 0xc0) === 0xc0) {
            const pointer = ((length & 0x3f) << 8) | data[currentOffset + 1];
            const [compressedLabel] = parseDNSQuestion(data, pointer);
            labels.push(compressedLabel.slice(0, -5));
            currentOffset += 2;
            const typeClass = data.slice(currentOffset, currentOffset + 4);
            currentOffset += 4;
            return [Buffer.concat([...labels, Buffer.from([0]), typeClass]), currentOffset];
        }
        
        labels.push(data.slice(currentOffset, currentOffset + length + 1));
        currentOffset += length + 1;
    }
    
    const typeClass = data.slice(currentOffset, currentOffset + 4);
    currentOffset += 4;
    
    return [Buffer.concat([...labels, typeClass]), currentOffset];
}

udpSocket.on("message", async (data: Buffer, remoteInfo: dgram.RemoteInfo) => {
    const queryId = data.readUInt16BE(0);
    const qdcount = data.readUInt16BE(4);

    if (resolverArg) {
        if (qdcount > 1) {
            let offset = 12;
            const responses: Buffer[] = [];
            const allQuestions: Buffer[] = [];
            
            // First collect all questions
            for (let i = 0; i < qdcount; i++) {
                const [question, newOffset] = parseDNSQuestion(data, offset);
                allQuestions.push(question);
                offset = newOffset;
            }
            
            // Get responses for each question
            for (let i = 0; i < qdcount; i++) {
                const singleHeader = Buffer.from([
                    ...data.slice(0, 2),    // Original ID
                    0x01, 0x00,             // Standard flags
                    0x00, 0x01,             // One question
                    0x00, 0x00,             // No answers yet
                    0x00, 0x00,             // No authority
                    0x00, 0x00              // No additional
                ]);

                const singlePacket = Buffer.concat([singleHeader, allQuestions[i]]);
                
                const responsePromise = new Promise<Buffer>((resolve) => {
                    forwardSocket.send(singlePacket, Number(resolverPortStr), resolverIp);
                    forwardSocket.once("message", resolve);
                });
                
                responses.push(await responsePromise);
            }

            // Extract answers from responses
            const allAnswers = responses.map(response => {
                return response.slice(12 + allQuestions[0].length);
            });

            const combinedHeader = Buffer.from([
                ...data.slice(0, 2),        // Keep original ID
                0x80, 0x00,                 // Response flags
                ...data.slice(4, 6),        // Original question count
                ...data.slice(4, 6),        // Match answer count to questions
                0x00, 0x00,                 // No authority
                0x00, 0x00                  // No additional
            ]);

            const finalResponse = Buffer.concat([
                combinedHeader,
                ...allQuestions,
                ...allAnswers
            ]);

            udpSocket.send(finalResponse, remoteInfo.port, remoteInfo.address);
        } else {
            forwardSocket.send(data, Number(resolverPortStr), resolverIp);
            forwardSocket.once("message", (response) => {
                udpSocket.send(response, remoteInfo.port, remoteInfo.address);
            });
        }
        return;
    }

    const header = new DNSMessageHeader();
    header.setId(queryId);
    header.setQR(1);
    header.setQDCount(qdcount);
    header.setANCount(qdcount);
    header.setRD(1);

    let offset = 12;
    const questions = [];
    const answers = [];

    for (let i = 0; i < qdcount; i++) {
        const [question, newOffset] = parseDNSQuestion(data, offset);
        questions.push(question);

        const answer = Buffer.concat([
            question.slice(0, -4),
            Buffer.from([
                0x00, 0x01,
                0x00, 0x01,
                0x00, 0x00, 0x00, 0x3c,
                0x00, 0x04,
                151, 101, 65, 140
            ])
        ]);
        
        answers.push(answer);
        offset = newOffset;
    }

    const response = Buffer.concat([header.toBuffer(), ...questions, ...answers]);
    udpSocket.send(response, remoteInfo.port, remoteInfo.address);
});
