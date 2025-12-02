using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Keyless]
public partial class vw_ServiceProviderBooking
{
    public int BookingId { get; set; }

    [StringLength(30)]
    public string Status { get; set; } = null!;

    [Precision(3)]
    public DateTime BookingDateTime { get; set; }

    [StringLength(20)]
    public string ServiceType { get; set; } = null!;

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? QuotedPrice { get; set; }

    [Column(TypeName = "numeric(12, 3)")]
    public decimal? DepositAmount { get; set; }

    public int ProviderId { get; set; }

    [StringLength(120)]
    public string BusinessName { get; set; } = null!;

    [StringLength(30)]
    public string? ProviderPhone { get; set; }

    [StringLength(100)]
    public string? ProviderName { get; set; }

    public int CustomerId { get; set; }

    [StringLength(30)]
    public string CustomerPhone { get; set; } = null!;

    [StringLength(100)]
    public string? CustomerName { get; set; }

    public int ServiceAddressId { get; set; }

    [StringLength(50)]
    public string? AddressLabel { get; set; }

    [StringLength(200)]
    public string Street { get; set; } = null!;

    [StringLength(100)]
    public string City { get; set; } = null!;

    [StringLength(100)]
    public string? Region { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? Latitude { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? Longitude { get; set; }

    [StringLength(120)]
    public string ServiceName { get; set; } = null!;

    [StringLength(255)]
    public string? ServiceDescription { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }
}
