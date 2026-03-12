<?php
try {
    if (!class_exists('Imagick')) {
        die("❌ Imagick extension index not found.\n");
    }

    $gsPath = shell_exec('where gswin64c.exe 2>nul') ?: shell_exec('where gs.exe 2>nul');
    if (!$gsPath) {
        echo "⚠️ Ghostscript (gs/gswin64c) NOT found in PATH.\n";
    } else {
        echo "✅ Ghostscript found at: " . trim($gsPath) . "\n";
    }

    // Try to check if it can actually process a PDF (this is the real test)
    // We'll just check if it supports the PDF format
    $imagick = new Imagick();
    $formats = $imagick->queryFormats('PDF');
    
    if (in_array('PDF', $formats)) {
        echo "✅ Imagick reports PDF support.\n";
    } else {
        echo "❌ Imagick does NOT report PDF support.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
