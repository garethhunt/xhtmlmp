<?php
header("Content-Type: multipart/mixed; boundary=part1x");
?>

--part1x
Content-Type: text/html
Content-Location: m-test1.php
Content-Transfer-Encoding: binary

<html>
  <head>
    <title>Multipart Test 1</title>
  </head>
  <body>
    <!-- The content should be output without barfing on this comment -->
    <p>This content is encoded using <em>multipart/mixed</em></p>
    <p>The Firefox image below is part of this Multipart package.</p>
    <div>
      <img src="product-firefox.gif" alt="Mozilla Firefox" />
    </div>
  </body>
</html>

--part1x
Content-Type: image/gif
Content-Location: product-firefox.gif
Content-Transfer-Encoding: binary

<?php include "product-firefox.gif" ?>

--part1x--
