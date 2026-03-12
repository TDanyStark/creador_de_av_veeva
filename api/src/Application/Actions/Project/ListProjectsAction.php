<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use Psr\Http\Message\ResponseInterface as Response;

class ListProjectsAction extends ProjectAction
{
    /**
     * {@inheritdoc}
     */
    protected function action(): Response
    {
        $userId = (int) $this->request->getAttribute('user_id');
        $queryParams = $this->request->getQueryParams();
        
        $page = isset($queryParams['page']) ? (int) $queryParams['page'] : 1;
        $limit = isset($queryParams['limit']) ? (int) $queryParams['limit'] : 10;
        $offset = ($page - 1) * $limit;

        $projects = $this->projectRepository->findByUserIdPaginated($userId, $limit, $offset);
        $total = $this->projectRepository->countByUserId($userId);

        return $this->respondWithData([
            'projects' => $projects,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit),
            ],
        ]);
    }
}
