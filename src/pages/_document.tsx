import { Html, Head, Main, NextScript } from "next/document";


export default function Document(){
    return(
        <Html>
            <Head>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <body>
                <script src="https://sdk.mercadopago.com/js/v2"></script>
                <Main/>
                <NextScript/>
            </body>
        </Html>
    )
}