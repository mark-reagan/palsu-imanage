<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:generate-web-push-keys')]
#[Description('Command description')]
class GenerateWebPushKeys extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
