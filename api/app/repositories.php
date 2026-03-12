<?php

declare(strict_types=1);

use App\Domain\User\UserRepositoryInterface;
use App\Infrastructure\Persistence\User\UserRepository;
use App\Domain\Project\ProjectRepositoryInterface;
use App\Infrastructure\Persistence\Project\ProjectRepository;
use App\Domain\Project\SlideRepositoryInterface;
use App\Infrastructure\Persistence\Project\SlideRepository;
use DI\ContainerBuilder;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        UserRepositoryInterface::class => \DI\autowire(UserRepository::class),
        ProjectRepositoryInterface::class => \DI\autowire(ProjectRepository::class),
        SlideRepositoryInterface::class => \DI\autowire(SlideRepository::class),
    ]);
};
