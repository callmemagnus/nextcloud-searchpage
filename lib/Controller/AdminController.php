<?php

namespace OCA\TheSearchPage\Controller;

use OCA\TheSearchPage\AppInfo\Application;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\GlobalScale\IConfig;
use OCP\Settings\ISettings;
use OCP\Util;

class AdminController implements ISettings
{
    public function __construct(private IConfig $config)
    {
    }


    /**
     * @inheritDoc
     */
    public function getForm()
    {
        Util::addScript(Application::APP_ID, 'admin.iife');
        return new TemplateResponse(Application::APP_ID, 'main');
    }

    /**
     * @inheritDoc
     */
    public function getSection()
    {
        // TODO: Implement getSection() method.
        return "additional";
    }

    /**
     * @inheritDoc
     */
    public function getPriority()
    {
        // TODO: Implement getPriority() method.
        return 50;
    }
}