<?php
$lang = (isset($_GET['lang']) && $_GET['lang'] === 'en') ? 'en' : 'pl';

$text = [
  'pl' => [
    'title' => 'MyBirds – ptaki do nauki',
    'description' => 'Prosta aplikacja z kilkoma ptakami do nauki.',
    'intro' => 'Kilka ptaków pod ręką do nauki. Kliknij kafelek.',
    'placeholder' => 'Wybierz ptaka z listy.',
  ],
  'en' => [
    'title' => 'MyBirds – birds for learning',
    'description' => 'A simple app with a few birds for learning.',
    'intro' => 'A few birds at hand for learning. Click a tile.',
    'placeholder' => 'Choose a bird from the list.',
  ],
];

$baseUrl = 'https://twoja-domena.pl/';
$canonical = ($lang === 'en') ? $baseUrl . '?lang=en' : $baseUrl;
$alternatePl = $baseUrl;
$alternateEn = $baseUrl . '?lang=en';

function h($value) {
  return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}
?>
<!doctype html>
<html lang="<?php echo h($lang); ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo h($text[$lang]['title']); ?></title>
  <meta name="description" content="<?php echo h($text[$lang]['description']); ?>">
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">


  <link rel="canonical" href="<?php echo h($canonical); ?>">
  <link rel="alternate" hreflang="pl" href="<?php echo h($alternatePl); ?>">
  <link rel="alternate" hreflang="en" href="<?php echo h($alternateEn); ?>">
  <link rel="alternate" hreflang="x-default" href="<?php echo h($alternatePl); ?>">

  <meta property="og:type" content="website">
  <meta property="og:title" content="<?php echo h($text[$lang]['title']); ?>">
  <meta property="og:description" content="<?php echo h($text[$lang]['description']); ?>">
  <meta property="og:url" content="<?php echo h($canonical); ?>">
  <meta property="og:locale" content="<?php echo $lang === 'pl' ? 'pl_PL' : 'en_US'; ?>">

  <link rel="stylesheet" href="style.css">

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-CYSQNLFHE6"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-CYSQNLFHE6');
  </script>

  <script>
    window.APP_LANG = "<?php echo h($lang); ?>";
  </script>
</head>
<body>
  <div class="page">
    <div class="card">
      <header class="header">
        <h1>MyBirds</h1>
        <p class="intro"><?php echo h($text[$lang]['intro']); ?></p>

        <p class="lang-switch">
          <?php if ($lang === 'pl'): ?>
            <span class="active">PL</span> | <a href="?lang=en">EN</a>
          <?php else: ?>
            <a href="./">PL</a> | <span class="active">EN</span>
          <?php endif; ?>
        </p>
      </header>

      <main>
        <section id="grid" class="grid"></section>

        <section id="details" class="details empty">
          <div class="placeholder">
            <?php echo h($text[$lang]['placeholder']); ?>
          </div>
        </section>
      </main>
    </div>
  </div>

  <script src="app.js"></script>

  <footer class="footer">
    © 2026 Marcin Szewczyk ·
    <a href="https://marcinszewczyk.net">marcinszewczyk.net</a>
  </footer>
</body>
</html>