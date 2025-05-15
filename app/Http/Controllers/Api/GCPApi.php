<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Google\Cloud\Retail\V2\Client\SearchServiceClient;
use Google\Cloud\Retail\V2\Client\ProductServiceClient;
use Google\Cloud\Retail\V2\SearchRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Retail\V2\ListProductsRequest;
use Symfony\Component\Console\Output\Output;

class GCPApi extends Controller
{
    private $client;
    private $id, $location, $catalog, $branch;

    public function __construct()
    {
        $this->client = new SearchServiceClient([
            'credentials' => storage_path('app/gcp/service-account.json')
        ]);

        $this->id = config('services.gcp.project_id');
        $this->location = config('services.gcp.location');
        $this->catalog = config('services.gcp.catalog_id');
        $this->branch = config('services.gcp.branch_id');
    }

    public function search(Request $request)
    {
        $user = Auth::guard('api')->user();

        $placement = sprintf('projects/%s/locations/%s/catalogs/%s/placements/%s', $this->id, $this->location, $this->catalog, $this->branch);

        $query = $request->get('q', '');

        $searchRequest = new SearchRequest([
            'placement' => $placement,
            'query' => $query,
            'visitor_id' => $user->id,
        ]);

        try {
            $response = $this->client->search($searchRequest);

            $results = [];
            foreach ($response->iterateAllElements() as $result) {
                $output = json_decode($result->serializeToJsonString());

                $results[] = $output;
            }

            // Trả về kết quả dưới dạng JSON
            return response()->json([
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            // Log lỗi nếu có
            Log::error("Search failed: " . $e->getMessage());

            return response()->json([
                'error' => 'Search failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function test()
    {
        $client = new ProductServiceClient([
            'credentials' => storage_path('app/gcp/service-account.json')
        ]);

        $parent = $client->branchName($this->id, $this->location, $this->catalog, 'default_branch'); // tốt hơn dùng branchName

        $request = new ListProductsRequest([
            'parent' => $parent,
            'page_size' => 50 // tuỳ chọn: số lượng sản phẩm mỗi trang
        ]);

        $response = $client->listProducts($request);

        foreach ($response as $product) {
            Log::info($product->serializeToJsonString());
        }
    }
}
