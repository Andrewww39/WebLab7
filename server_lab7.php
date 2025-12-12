<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$logFile = 'logs.txt';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if ($input) {
    date_default_timezone_set('Europe/Kiev');
    $serverTime = date("Y-m-d H:i:s.u");

    $logEntry = "";
    
    if (isset($input['method']) && $input['method'] == 'immediate') {
        $logEntry = "METHOD_1 [ServerTime: $serverTime] | Event: {$input['event']} | ID: {$input['id']}\n";
    } elseif (isset($input['method']) && $input['method'] == 'bulk') {
        $logEntry = "\n--- BULK SAVE (METHOD 2) ---\n";
        foreach ($input['data'] as $item) {
            $logEntry .= "METHOD_2 [SavedAtLS: {$item['time']}] | Event: {$item['event']} | ID: {$item['id']}\n";
        }
        $logEntry .= "--- END BULK ---\n";
    }

    file_put_contents($logFile, $logEntry, FILE_APPEND);

    echo json_encode(["status" => "success", "serverTime" => $serverTime]);
} else {
    echo json_encode(["status" => "error", "message" => "No data"]);
}
?>